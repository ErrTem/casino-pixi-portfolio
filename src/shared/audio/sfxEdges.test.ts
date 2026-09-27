import { expect, it } from "vitest";
import type { CrashSnapshot } from "../../games/crash/logic/index.js";
import { sfxEventsFromTransition } from "./sfxEdges.js";

function snap(partial: Partial<CrashSnapshot>): CrashSnapshot {
  return {
    phase: "waiting",
    multiplier: 1,
    balance: 5000,
    bet: null,
    crashAt: null,
    waitRemainingMs: 5000,
    history: [],
    roundId: 1,
    autoCashOutAt: null,
    cashOutAt: null,
    ...partial,
  };
}

it("returns [] when prev is null", () => {
  expect(sfxEventsFromTransition(null, snap({ phase: "waiting" }))).toEqual(
    [],
  );
});

it("emits takeoff on waiting -> flying", () => {
  const prev = snap({ phase: "waiting", bet: 100 });
  const next = snap({
    phase: "flying",
    bet: 100,
    multiplier: 1.01,
    crashAt: 2.5,
  });
  expect(sfxEventsFromTransition(prev, next)).toEqual(["takeoff"]);
});

it("emits cash_out when cashOutAt latches null -> value", () => {
  const prev = snap({
    phase: "flying",
    bet: 100,
    cashOutAt: null,
    multiplier: 1.8,
  });
  const next = snap({
    phase: "cashed_out",
    bet: 100,
    cashOutAt: 1.8,
    multiplier: 1.8,
  });
  expect(sfxEventsFromTransition(prev, next)).toEqual(["cash_out"]);
});

it("emits crash when returning to waiting with history growth", () => {
  const prev = snap({
    phase: "flying",
    bet: 100,
    history: [1.5],
    crashAt: 2.0,
  });
  const next = snap({
    phase: "waiting",
    bet: null,
    history: [1.5, 2.0],
    waitRemainingMs: 5000,
  });
  expect(sfxEventsFromTransition(prev, next)).toEqual(["crash"]);
});

it("never emits bet_lock from snapshot edges", () => {
  const prev = snap({ phase: "waiting", bet: null });
  const next = snap({ phase: "waiting", bet: 100 });
  expect(sfxEventsFromTransition(prev, next)).not.toContain("bet_lock");
  expect(sfxEventsFromTransition(prev, next)).toEqual([]);
});

it("replaying the same prev/next pair is idempotent (same single-event set)", () => {
  const prev = snap({ phase: "waiting", bet: 50 });
  const next = snap({
    phase: "flying",
    bet: 50,
    multiplier: 1.02,
    crashAt: 3,
  });
  const first = sfxEventsFromTransition(prev, next);
  const second = sfxEventsFromTransition(prev, next);
  expect(first).toEqual(["takeoff"]);
  expect(second).toEqual(first);
});
