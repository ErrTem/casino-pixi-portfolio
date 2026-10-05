import type { Cents } from "../../../shared/money/cents.js";
import { CRASH_CONFIG } from "./config.js";

export type Phase = "waiting" | "flying" | "cashed_out" | "crashed";

/** slot index for dual-bet panels (0 = left, 1 = right) */
export type BetSlotId = 0 | 1;

export const BET_SLOT_IDS: readonly BetSlotId[] = [0, 1] as const;

/** per panel bet state - independent place / cancel / cash-out / auto CO */
export interface BetSlot {
  lockedBetCents: Cents | null;
  /** stake retained after cash out for CASHED OUT chrome (cleared on waiting). */
  paidStakeCents: Cents | null;
  cashOutRequested: boolean;
  autoCashOutAt: number | null;
  /** paid cash-out x while settled via CO; null if open or lost */
  cashOutAt: number | null;
  /** true after cash out credit or crash loss for this slot */
  settled: boolean;
}

/** display snapshot for one bet panel */
export interface BetSnap {
  /** stake in display units, or null if no locked/opened bet */
  amount: number | null;
  cashOutAt: number | null;
  autoCashOutAt: number | null;
  /** true when this slot cashed out (panel shows CASHED OUT) */
  cashedOut: boolean;
}

export interface RoundState {
  phase: Phase;
  waitRemainingMs: number;
  elapsedMs: number;
  multiplier: number;
  /** sampled once in startRound; null while waiting before first launch */
  crashAt: number | null;
  roundId: number;
  slots: [BetSlot, BetSlot];
  /** last roundId that already pushed history - idempotent crash guard */
  settledRoundId: number | null;
}

export interface CrashSnapshot {
  phase: Phase;
  multiplier: number;
  /** display units */
  balance: number;
  /** dual bet panel snapshots */
  bets: [BetSnap, BetSnap];
  /**
   * first non null slot cashOutAt - theater / SFX latch
   */
  cashOutAt: number | null;
  /**
   * slot 0 stake for legacy single-bet callers; prefer `bets[i].amount`
   * null when slot 0 has no open/cashed stake this round.
   */
  bet: number | null;
  /**
   * slot 0 auto CO for legacy callers; prefer `bets[i].autoCashOutAt`
   */
  autoCashOutAt: number | null;
  crashAt: number | null;
  waitRemainingMs: number;
  history: readonly number[];
  roundId: number;
}

export function emptyBetSlot(): BetSlot {
  return {
    lockedBetCents: null,
    paidStakeCents: null,
    cashOutRequested: false,
    autoCashOutAt: null,
    cashOutAt: null,
    settled: false,
  };
}

/** fresh slots keeping per slot autoCashOutAt across rounds */
export function clearSlotsKeepAuto(
  slots: readonly [BetSlot, BetSlot],
): [BetSlot, BetSlot] {
  return [
    {
      ...emptyBetSlot(),
      autoCashOutAt: slots[0].autoCashOutAt,
    },
    {
      ...emptyBetSlot(),
      autoCashOutAt: slots[1].autoCashOutAt,
    },
  ];
}

export function createInitialRoundState(): RoundState {
  return {
    phase: "waiting",
    waitRemainingMs: CRASH_CONFIG.waitDurationMs,
    elapsedMs: 0,
    multiplier: 1,
    crashAt: null,
    roundId: 0,
    slots: [emptyBetSlot(), emptyBetSlot()],
    settledRoundId: null,
  };
}
