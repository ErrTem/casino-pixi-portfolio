import { describe, expect, it } from "vitest";
import {
  createInitialViewMode,
  reduceViewMode,
  type ViewModeSnap,
} from "../src/games/crash/view/viewMode.js";

function snap(partial: Partial<ViewModeSnap>): ViewModeSnap {
  return {
    phase: "waiting",
    multiplier: 1,
    cashOutAt: null,
    history: [],
    ...partial,
  };
}

describe("viewMode - idle / climb / hold / fade", () => {
  it("initial waiting stays idle", () => {
    const prev = createInitialViewMode();
    const next = reduceViewMode(prev, snap({ phase: "waiting" }), 16);
    expect(next.mode).toBe("idle");
  });

  it("flying enters climb with rocketVisible true", () => {
    let s = createInitialViewMode();
    s = reduceViewMode(s, snap({ phase: "flying", multiplier: 1.5 }), 16);
    expect(s.mode).toBe("climb");
    expect(s.rocketVisible).toBe(true);
  });

  it("climb then waiting enters crash_hold with rocketVisible false", () => {
    let s = createInitialViewMode();
    s = reduceViewMode(s, snap({ phase: "flying", multiplier: 2 }), 16);
    s = reduceViewMode(
      s,
      snap({ phase: "waiting", multiplier: 1, history: [2.45] }),
      16,
    );
    expect(s.mode).toBe("crash_hold");
    expect(s.rocketVisible).toBe(false);
    expect(s.latchedCrashMult).toBe(2.45);
    expect(s.trailAlpha).toBe(1);
  });

  it("3000ms of deltaMS enters crash_fade; 400ms more enters idle and clears latchedCashOut", () => {
    let s = createInitialViewMode();
    s = reduceViewMode(s, snap({ phase: "flying", multiplier: 2 }), 16);
    s = reduceViewMode(
      s,
      snap({
        phase: "waiting",
        history: [3],
        cashOutAt: null,
      }),
      16,
    );
    // Latch was set during climb in a prior frame - simulate via climb with cashOutAt
    s = {
      ...s,
      latchedCashOut: 1.75,
    };
    s = reduceViewMode(
      s,
      snap({ phase: "waiting", history: [3] }),
      3000,
    );
    expect(s.mode).toBe("crash_fade");
    expect(s.latchedCashOut).toBe(1.75);

    s = reduceViewMode(s, snap({ phase: "waiting", history: [3] }), 400);
    expect(s.mode).toBe("idle");
    expect(s.latchedCashOut).toBeNull();
  });

  it("cashed_out snap stays in climb", () => {
    let s = createInitialViewMode();
    s = reduceViewMode(
      s,
      snap({ phase: "cashed_out", multiplier: 2.1, cashOutAt: 1.8 }),
      16,
    );
    expect(s.mode).toBe("climb");
    expect(s.latchedCashOut).toBe(1.8);
  });

  it("synthetic cashOutAt is latched on climb and still present on first crash_hold frame", () => {
    let s = createInitialViewMode();
    s = reduceViewMode(
      s,
      snap({ phase: "flying", multiplier: 1.5, cashOutAt: 1.42 }),
      16,
    );
    expect(s.mode).toBe("climb");
    expect(s.latchedCashOut).toBe(1.42);

    s = reduceViewMode(
      s,
      snap({ phase: "waiting", history: [4.2], cashOutAt: null }),
      16,
    );
    expect(s.mode).toBe("crash_hold");
    expect(s.latchedCashOut).toBe(1.42);
  });
});
