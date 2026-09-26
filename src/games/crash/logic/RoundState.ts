import type { Cents } from "../../../shared/money/cents.js";
import { CRASH_CONFIG } from "./config.js";

export type Phase = "waiting" | "flying" | "cashed_out" | "crashed";

export interface RoundState {
  phase: Phase;
  waitRemainingMs: number;
  elapsedMs: number;
  multiplier: number;
  /** Sampled once in startRound; null while waiting before first launch. */
  crashAt: number | null;
  /** Paid cash-out multiplier while spectator-finishing; null otherwise (D-16). */
  cashOutAt: number | null;
  roundId: number;
  /** Stake locked for the current/next round (deducted from wallet on place). */
  lockedBetCents: Cents | null;
  cashOutRequested: boolean;
  autoCashOutAt: number | null;
  /** Last roundId that already settled — idempotent settle guard. */
  settledRoundId: number | null;
}

export interface CrashSnapshot {
  phase: Phase;
  multiplier: number;
  /** Display units (e.g. 5000.00). */
  balance: number;
  /** Display units, or null if no locked bet. */
  bet: number | null;
  crashAt: number | null;
  /** Paid cash-out × while cashed_out; null after enterWaiting / unsettled flight. */
  cashOutAt: number | null;
  waitRemainingMs: number;
  history: readonly number[];
  roundId: number;
  autoCashOutAt: number | null;
}

export function createInitialRoundState(): RoundState {
  return {
    phase: "waiting",
    waitRemainingMs: CRASH_CONFIG.waitDurationMs,
    elapsedMs: 0,
    multiplier: 1,
    crashAt: null,
    cashOutAt: null,
    roundId: 0,
    lockedBetCents: null,
    cashOutRequested: false,
    autoCashOutAt: null,
    settledRoundId: null,
  };
}
