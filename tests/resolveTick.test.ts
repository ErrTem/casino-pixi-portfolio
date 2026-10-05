import { describe, expect, it } from "vitest";
import { createGame } from "../src/games/crash/logic/CrashGame.js";
import { CRASH_CONFIG } from "../src/games/crash/logic/config.js";
import { History } from "../src/games/crash/logic/History.js";
import { resolveTick } from "../src/games/crash/logic/resolveTick.js";
import {
  emptyBetSlot,
  type BetSlot,
  type RoundState,
} from "../src/games/crash/logic/RoundState.js";
import { Wallet } from "../src/games/crash/logic/Wallet.js";
import {
  payoutCents,
  toMultHundredths,
} from "../src/shared/money/cents.js";
import { createRng } from "../src/shared/rng/createRng.js";

function makeDeps(seed = "resolve-tick") {
  return {
    rng: createRng(seed),
    wallet: new Wallet(),
    history: new History(),
  };
}

function slotWithBet(
  lockedBetCents: number,
  overrides: Partial<BetSlot> = {},
): BetSlot {
  return {
    ...emptyBetSlot(),
    lockedBetCents,
    ...overrides,
  };
}

function flyingState(overrides: Partial<RoundState> = {}): RoundState {
  // +100ms tick -> doubling time -> 2.00 under current growthRatePerMs
  const twoXMs = Math.LN2 / CRASH_CONFIG.growthRatePerMs;
  return {
    phase: "flying",
    waitRemainingMs: 0,
    elapsedMs: twoXMs - CRASH_CONFIG.maxDeltaMs,
    multiplier: 1.96,
    crashAt: 10,
    roundId: 1,
    slots: [slotWithBet(10_000), emptyBetSlot()],
    settledRoundId: null,
    ...overrides,
  };
}

/** Advance a cashed_out state until crash or guard expires. */
function tickUntilWaiting(
  state: RoundState,
  deps: ReturnType<typeof makeDeps>,
  maxMs = 300_000,
): RoundState {
  let next = state;
  let guard = 0;
  while (next.phase !== "waiting" && guard < maxMs) {
    next = resolveTick(next, CRASH_CONFIG.maxDeltaMs, deps);
    guard += CRASH_CONFIG.maxDeltaMs;
  }
  return next;
}

describe("resolveTick - manual cash-out and crash settle (PLAY-03 / PLAY-04)", () => {
  it("manual cash-out pays stake times rounded current multiplier (PLAY-03)", () => {
    const deps = makeDeps();
    expect(deps.wallet.placeBet(10_000)).toEqual({ ok: true });
    const balBefore = deps.wallet.getBalanceCents();

    const state = resolveTick(
      flyingState({
        slots: [
          slotWithBet(10_000, { cashOutRequested: true }),
          emptyBetSlot(),
        ],
        crashAt: 10,
      }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );

    // D-16: cash-out stays durable cashed_out; history waits for crashAt
    expect(state.phase).toBe("cashed_out");
    expect(state.settledRoundId).toBeNull();
    expect(state.crashAt).toBe(10);
    expect(state.slots[0].cashOutAt).toBe(2);
    expect(state.slots[0].lockedBetCents).toBeNull();
    expect(state.slots[0].settled).toBe(true);
    const expectedPayout = payoutCents(10_000, toMultHundredths(2));
    expect(deps.wallet.getBalanceCents()).toBe(balBefore + expectedPayout);
    expect(deps.history.toArray()).toEqual([]);

    const afterCrash = tickUntilWaiting(state, deps);
    expect(afterCrash.phase).toBe("waiting");
    expect(afterCrash.waitRemainingMs).toBe(
      CRASH_CONFIG.waitDurationMs + CRASH_CONFIG.crashDisplayMs,
    );
    expect(afterCrash.slots[0].cashOutAt).toBeNull();
    expect(deps.history.toArray()).toEqual([10]);
    expect(deps.wallet.getBalanceCents()).toBe(balBefore + expectedPayout);
  });

  it("requestCashOut while waiting is a no-op", () => {
    const game = createGame({ seed: "waiting-co" });
    expect(game.getSnapshot().phase).toBe("waiting");
    const before = game.getSnapshot();
    game.requestCashOut(0);
    game.tick(CRASH_CONFIG.maxDeltaMs);
    const after = game.getSnapshot();
    expect(after.phase).toBe("waiting");
    expect(after.balance).toBe(before.balance);
    expect(after.waitRemainingMs).toBe(
      before.waitRemainingMs - CRASH_CONFIG.maxDeltaMs,
    );
  });

  it("crash settle loses locked stake with no payout (PLAY-04)", () => {
    const deps = makeDeps();
    expect(deps.wallet.placeBet(10_000)).toEqual({ ok: true });
    const balBefore = deps.wallet.getBalanceCents();

    const state = resolveTick(
      flyingState({ crashAt: 2 }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );

    expect(state.phase).toBe("waiting");
    expect(state.settledRoundId).toBe(1);
    expect(deps.wallet.getBalanceCents()).toBe(balBefore); // no credit
    expect(deps.history.toArray()).toEqual([2]);
  });

  it("idempotent settle does not change balance twice for same roundId", () => {
    const deps = makeDeps();
    expect(deps.wallet.placeBet(10_000)).toEqual({ ok: true });

    let state = resolveTick(
      flyingState({
        slots: [
          slotWithBet(10_000, { cashOutRequested: true }),
          emptyBetSlot(),
        ],
        crashAt: 10,
      }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );
    const afterFirst = deps.wallet.getBalanceCents();
    expect(state.phase).toBe("cashed_out");
    expect(state.slots[0].settled).toBe(true);

    // Second tick while cashed_out must not credit again
    state = resolveTick(state, CRASH_CONFIG.maxDeltaMs, deps);
    expect(deps.wallet.getBalanceCents()).toBe(afterFirst);
    expect(state.phase).toBe("cashed_out");
  });

  it("crash check compares rounded multipliers versus crashAt (D-11)", () => {
    const deps = makeDeps();
    expect(deps.wallet.placeBet(10_000)).toEqual({ ok: true });
    const balBefore = deps.wallet.getBalanceCents();

    const state = resolveTick(
      flyingState({ crashAt: 2.004 }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );

    expect(state.phase).toBe("waiting");
    expect(state.settledRoundId).toBe(1);
    expect(deps.wallet.getBalanceCents()).toBe(balBefore);
    expect(deps.history.length).toBe(1);
  });

  it("dual slots: one cashes out while the other stays open (phase flying)", () => {
    const deps = makeDeps();
    expect(deps.wallet.placeBet(10_000)).toEqual({ ok: true });
    expect(deps.wallet.placeBet(5_000)).toEqual({ ok: true });
    const balBefore = deps.wallet.getBalanceCents();

    const state = resolveTick(
      flyingState({
        slots: [
          slotWithBet(10_000, { cashOutRequested: true }),
          slotWithBet(5_000),
        ],
        crashAt: 10,
      }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );

    expect(state.phase).toBe("flying");
    expect(state.slots[0].settled).toBe(true);
    expect(state.slots[0].cashOutAt).toBe(2);
    expect(state.slots[1].settled).toBe(false);
    expect(state.slots[1].lockedBetCents).toBe(5_000);
    const expectedPayout = payoutCents(10_000, toMultHundredths(2));
    expect(deps.wallet.getBalanceCents()).toBe(balBefore + expectedPayout);
  });
});

describe("resolveTick - auto cash-out (WALT-04)", () => {
  it("auto cash-out settles when rounded multiplier reaches target before crash", () => {
    const deps = makeDeps();
    expect(deps.wallet.placeBet(10_000)).toEqual({ ok: true });
    const balBefore = deps.wallet.getBalanceCents();

    const state = resolveTick(
      flyingState({
        crashAt: 10,
        slots: [
          slotWithBet(10_000, { autoCashOutAt: 2 }),
          emptyBetSlot(),
        ],
      }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );

    expect(state.phase).toBe("cashed_out");
    expect(state.crashAt).toBe(10);
    expect(state.slots[0].cashOutAt).toBe(2);
    const expectedPayout = payoutCents(10_000, toMultHundredths(2));
    expect(deps.wallet.getBalanceCents()).toBe(balBefore + expectedPayout);
    expect(deps.history.toArray()).toEqual([]);

    const afterCrash = tickUntilWaiting(state, deps);
    expect(afterCrash.phase).toBe("waiting");
    expect(afterCrash.waitRemainingMs).toBe(
      CRASH_CONFIG.waitDurationMs + CRASH_CONFIG.crashDisplayMs,
    );
    expect(afterCrash.slots[0].cashOutAt).toBeNull();
    expect(deps.history.toArray()).toEqual([10]);
  });

  it("setAutoCashOut(null) disables auto settle", () => {
    const deps = makeDeps();
    expect(deps.wallet.placeBet(10_000)).toEqual({ ok: true });
    const balBefore = deps.wallet.getBalanceCents();

    const state = resolveTick(
      flyingState({
        crashAt: 10,
        slots: [slotWithBet(10_000, { autoCashOutAt: null }), emptyBetSlot()],
      }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );

    expect(state.phase).toBe("flying");
    expect(deps.wallet.getBalanceCents()).toBe(balBefore);
  });

  it("crash-before-auto: when autoCashOutAt equals crashAt, crash wins with no payout", () => {
    const deps = makeDeps();
    expect(deps.wallet.placeBet(10_000)).toEqual({ ok: true });
    const balBefore = deps.wallet.getBalanceCents();

    const state = resolveTick(
      flyingState({
        crashAt: 2,
        slots: [slotWithBet(10_000, { autoCashOutAt: 2 }), emptyBetSlot()],
      }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );

    expect(state.phase).toBe("waiting");
    expect(state.settledRoundId).toBe(1);
    expect(deps.wallet.getBalanceCents()).toBe(balBefore);
    expect(deps.history.toArray()).toEqual([2]);
  });

  it("manual cash-out intent still loses to crash on the same tick", () => {
    const deps = makeDeps();
    expect(deps.wallet.placeBet(10_000)).toEqual({ ok: true });
    const balBefore = deps.wallet.getBalanceCents();

    const state = resolveTick(
      flyingState({
        crashAt: 2,
        slots: [
          slotWithBet(10_000, { cashOutRequested: true }),
          emptyBetSlot(),
        ],
      }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );

    expect(state.phase).toBe("waiting");
    expect(deps.wallet.getBalanceCents()).toBe(balBefore);
  });

  it("setAutoCashOut stores target rounded to 2dp per slot", () => {
    const game = createGame({ seed: "auto-2dp" });
    game.setAutoCashOut(0, 2.004);
    expect(game.getSnapshot().bets[0].autoCashOutAt).toBe(2);
    expect(game.getSnapshot().autoCashOutAt).toBe(2);
    game.setAutoCashOut(0, null);
    expect(game.getSnapshot().bets[0].autoCashOutAt).toBeNull();
  });
});
