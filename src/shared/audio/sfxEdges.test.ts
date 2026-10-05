import { expect, it } from "vitest";
import type { BetSnap, CrashSnapshot } from "../../games/crash/logic/index.js";
import { sfxEventsFromTransition } from "./sfxEdges.js";

function emptyBet(partial: Partial<BetSnap> = {}): BetSnap {
  return {
    amount: null,
    cashOutAt: null,
    autoCashOutAt: null,
    cashedOut: false,
    ...partial,
  };
}

function snap(partial: Partial<CrashSnapshot> = {}): CrashSnapshot {
  const bets: [BetSnap, BetSnap] = partial.bets ?? [emptyBet(), emptyBet()];
  return {
    phase: partial.phase ?? "waiting",
    multiplier: partial.multiplier ?? 1,
    balance: partial.balance ?? 5000,
    bets,
    bet: partial.bet !== undefined ? partial.bet : bets[0].amount,
    crashAt: partial.crashAt ?? null,
    waitRemainingMs: partial.waitRemainingMs ?? 5000,
    history: partial.history ?? [],
    roundId: partial.roundId ?? 1,
    autoCashOutAt:
      partial.autoCashOutAt !== undefined
        ? partial.autoCashOutAt
        : bets[0].autoCashOutAt,
    cashOutAt: partial.cashOutAt ?? null,
  };
}

it("returns [] when prev is null", () => {
  expect(sfxEventsFromTransition(null, snap({ phase: "waiting" }))).toEqual(
    [],
  );
});

it("emits takeoff on waiting -> flying", () => {
  const bet = emptyBet({ amount: 100 });
  const prev = snap({ phase: "waiting", bets: [bet, emptyBet()] });
  const next = snap({
    phase: "flying",
    bets: [bet, emptyBet()],
    multiplier: 1.01,
    crashAt: 2.5,
  });
  expect(sfxEventsFromTransition(prev, next)).toEqual(["takeoff"]);
});

it("emits cash_out when cashOutAt latches null -> value", () => {
  const open = emptyBet({ amount: 100 });
  const cashed = emptyBet({
    amount: 100,
    cashOutAt: 1.8,
    cashedOut: true,
  });
  const prev = snap({
    phase: "flying",
    bets: [open, emptyBet()],
    cashOutAt: null,
    multiplier: 1.8,
  });
  const next = snap({
    phase: "cashed_out",
    bets: [cashed, emptyBet()],
    cashOutAt: 1.8,
    multiplier: 1.8,
  });
  expect(sfxEventsFromTransition(prev, next)).toEqual(["cash_out"]);
});

it("emits crash when returning to waiting with history growth", () => {
  const bet = emptyBet({ amount: 100 });
  const prev = snap({
    phase: "flying",
    bets: [bet, emptyBet()],
    history: [1.5],
    crashAt: 2.0,
  });
  const next = snap({
    phase: "waiting",
    history: [1.5, 2.0],
    waitRemainingMs: 5000,
  });
  expect(sfxEventsFromTransition(prev, next)).toEqual(["crash"]);
});

it("never emits bet_lock from snapshot edges", () => {
  const prev = snap({ phase: "waiting" });
  const next = snap({
    phase: "waiting",
    bets: [emptyBet({ amount: 100 }), emptyBet()],
  });
  expect(sfxEventsFromTransition(prev, next)).not.toContain("bet_lock");
  expect(sfxEventsFromTransition(prev, next)).toEqual([]);
});

it("replaying the same prev/next pair is idempotent (same single-event set)", () => {
  const bet = emptyBet({ amount: 50 });
  const prev = snap({ phase: "waiting", bets: [bet, emptyBet()] });
  const next = snap({
    phase: "flying",
    bets: [bet, emptyBet()],
    multiplier: 1.02,
    crashAt: 3,
  });
  const first = sfxEventsFromTransition(prev, next);
  const second = sfxEventsFromTransition(prev, next);
  expect(first).toEqual(["takeoff"]);
  expect(second).toEqual(first);
});
