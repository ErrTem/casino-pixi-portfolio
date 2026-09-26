import { describe, expect, it } from "vitest";
import { createGame } from "../src/games/crash/logic/CrashGame.js";
import { CRASH_CONFIG } from "../src/games/crash/logic/config.js";
import { History } from "../src/games/crash/logic/History.js";
import { resolveTick } from "../src/games/crash/logic/resolveTick.js";
import type { RoundState } from "../src/games/crash/logic/RoundState.js";
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

function flyingState(overrides: Partial<RoundState> = {}): RoundState {
  return {
    phase: "flying",
    waitRemainingMs: 0,
    elapsedMs: 2400,
    multiplier: 1.93,
    crashAt: 10,
    roundId: 1,
    lockedBetCents: 10_000,
    cashOutRequested: false,
    autoCashOutAt: null,
    settledRoundId: null,
    ...overrides,
  };
}

describe("resolveTick — manual cash-out and crash settle (PLAY-03 / PLAY-04)", () => {
  it("manual cash-out pays stake times rounded current multiplier (PLAY-03)", () => {
    const deps = makeDeps();
    expect(deps.wallet.placeBet(10_000)).toEqual({ ok: true });
    const balBefore = deps.wallet.getBalanceCents();

    const state = resolveTick(
      flyingState({ cashOutRequested: true, crashAt: 10 }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );

    expect(state.phase).toBe("waiting");
    expect(state.settledRoundId).toBe(1);
    expect(state.waitRemainingMs).toBe(CRASH_CONFIG.waitDurationMs);
    // elapsed 2400+100 → multiplierAt ≈ 2.00
    const expectedPayout = payoutCents(10_000, toMultHundredths(2));
    expect(deps.wallet.getBalanceCents()).toBe(balBefore + expectedPayout);
    expect(deps.history.toArray()).toEqual([10]);
  });

  it("requestCashOut while waiting is a no-op", () => {
    const game = createGame({ seed: "waiting-co" });
    expect(game.getSnapshot().phase).toBe("waiting");
    const before = game.getSnapshot();
    game.requestCashOut();
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
      flyingState({ crashAt: 2, cashOutRequested: false }),
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
      flyingState({ cashOutRequested: true, crashAt: 10 }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );
    const afterFirst = deps.wallet.getBalanceCents();
    expect(state.settledRoundId).toBe(1);

    // Force a second settle attempt for the same roundId
    state = resolveTick(
      flyingState({
        cashOutRequested: true,
        crashAt: 10,
        settledRoundId: 1,
        lockedBetCents: 10_000,
      }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );
    expect(deps.wallet.getBalanceCents()).toBe(afterFirst);
    expect(state.phase).toBe("waiting");
  });

  it("crash check compares rounded multipliers versus crashAt (D-11)", () => {
    const deps = makeDeps();
    expect(deps.wallet.placeBet(10_000)).toEqual({ ok: true });
    const balBefore = deps.wallet.getBalanceCents();

    // Unrounded crashAt 2.004 — float 2.00 >= 2.004 is false; rounded both are 2.00
    const state = resolveTick(
      flyingState({ crashAt: 2.004, cashOutRequested: false }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );

    expect(state.phase).toBe("waiting");
    expect(state.settledRoundId).toBe(1);
    expect(deps.wallet.getBalanceCents()).toBe(balBefore);
    expect(deps.history.length).toBe(1);
  });
});

describe("resolveTick — auto cash-out (WALT-04)", () => {
  it("auto cash-out settles when rounded multiplier reaches target before crash", () => {
    const deps = makeDeps();
    expect(deps.wallet.placeBet(10_000)).toEqual({ ok: true });
    const balBefore = deps.wallet.getBalanceCents();

    const state = resolveTick(
      flyingState({
        crashAt: 10,
        autoCashOutAt: 2,
        cashOutRequested: false,
      }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );

    expect(state.phase).toBe("waiting");
    expect(state.settledRoundId).toBe(1);
    const expectedPayout = payoutCents(10_000, toMultHundredths(2));
    expect(deps.wallet.getBalanceCents()).toBe(balBefore + expectedPayout);
  });

  it("setAutoCashOut(null) disables auto settle", () => {
    const deps = makeDeps();
    expect(deps.wallet.placeBet(10_000)).toEqual({ ok: true });
    const balBefore = deps.wallet.getBalanceCents();

    const state = resolveTick(
      flyingState({
        crashAt: 10,
        autoCashOutAt: null,
        cashOutRequested: false,
      }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );

    // At ~2.00 with no auto and no manual — still flying
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
        autoCashOutAt: 2,
        cashOutRequested: false,
      }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );

    expect(state.phase).toBe("waiting");
    expect(state.settledRoundId).toBe(1);
    expect(deps.wallet.getBalanceCents()).toBe(balBefore); // no payout
    expect(deps.history.toArray()).toEqual([2]);
  });

  it("manual cash-out intent still loses to crash on the same tick", () => {
    const deps = makeDeps();
    expect(deps.wallet.placeBet(10_000)).toEqual({ ok: true });
    const balBefore = deps.wallet.getBalanceCents();

    const state = resolveTick(
      flyingState({
        crashAt: 2,
        autoCashOutAt: null,
        cashOutRequested: true,
      }),
      CRASH_CONFIG.maxDeltaMs,
      deps,
    );

    expect(state.phase).toBe("waiting");
    expect(deps.wallet.getBalanceCents()).toBe(balBefore); // crash, not cash-out
  });

  it("setAutoCashOut stores target rounded to 2dp", () => {
    const game = createGame({ seed: "auto-2dp" });
    game.setAutoCashOut(2.004);
    expect(game.getSnapshot().autoCashOutAt).toBe(2);
    game.setAutoCashOut(null);
    expect(game.getSnapshot().autoCashOutAt).toBeNull();
  });
});
