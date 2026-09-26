import { VIEW_CONFIG } from "./viewConfig.js";

export type ViewModeName = "idle" | "climb" | "crash_hold" | "crash_fade";

/** Minimal snapshot fields the view-mode clock reads (cashOutAt until plan 03-02). */
export interface ViewModeSnap {
  phase: string;
  multiplier: number;
  cashOutAt: number | null;
  history: readonly number[];
}

export interface ViewModeState {
  mode: ViewModeName;
  modeElapsedMs: number;
  latchedCashOut: number | null;
  latchedCrashMult: number | null;
  rocketVisible: boolean;
  trailAlpha: number;
}

export function createInitialViewMode(): ViewModeState {
  return {
    mode: "idle",
    modeElapsedMs: 0,
    latchedCashOut: null,
    latchedCrashMult: null,
    rocketVisible: true,
    trailAlpha: 0,
  };
}

function isClimbPhase(phase: string): boolean {
  return phase === "flying" || phase === "cashed_out";
}

/**
 * Pure view-mode clock. Timers accumulate deltaMS; never calls tick or reads waitRemainingMs.
 * Boot waiting stays idle; only climb→waiting enters crash_hold (D-11, D-12, D-18).
 */
export function reduceViewMode(
  prev: ViewModeState,
  snap: ViewModeSnap,
  deltaMS: number,
): ViewModeState {
  const dt = Number.isFinite(deltaMS) ? Math.max(0, deltaMS) : 0;
  let next: ViewModeState = { ...prev };

  if (next.mode === "idle") {
    if (isClimbPhase(snap.phase)) {
      next = {
        ...next,
        mode: "climb",
        modeElapsedMs: 0,
        rocketVisible: true,
        trailAlpha: 1,
      };
    }
  } else if (next.mode === "climb") {
    if (snap.phase === "waiting") {
      const lastHist =
        snap.history.length > 0
          ? snap.history[snap.history.length - 1]!
          : null;
      next = {
        ...next,
        mode: "crash_hold",
        modeElapsedMs: 0,
        rocketVisible: false,
        trailAlpha: 1,
        latchedCrashMult: lastHist,
      };
    }
  } else if (next.mode === "crash_hold") {
    next = {
      ...next,
      modeElapsedMs: next.modeElapsedMs + dt,
      rocketVisible: false,
      trailAlpha: 1,
    };
    if (next.modeElapsedMs >= VIEW_CONFIG.HOLD_MS) {
      next = {
        ...next,
        mode: "crash_fade",
        modeElapsedMs: 0,
      };
    }
  } else if (next.mode === "crash_fade") {
    const elapsed = next.modeElapsedMs + dt;
    const t = Math.min(1, elapsed / VIEW_CONFIG.FADE_MS);
    next = {
      ...next,
      modeElapsedMs: elapsed,
      rocketVisible: false,
      trailAlpha: 1 - t,
    };
    if (elapsed >= VIEW_CONFIG.FADE_MS) {
      next = {
        ...next,
        mode: "idle",
        modeElapsedMs: 0,
        latchedCashOut: null,
        rocketVisible: true,
        trailAlpha: 0,
      };
    }
  }

  // Latch cash-out while climbing; keep through crash_hold (D-16 / D-20 clear on fade).
  if (next.mode === "climb" && Number.isFinite(snap.cashOutAt as number)) {
    next = { ...next, latchedCashOut: snap.cashOutAt };
  }

  return next;
}
