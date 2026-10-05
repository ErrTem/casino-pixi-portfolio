import type { BetSnap, CrashSnapshot } from "../logic/index.js";
import { CRASH_CONFIG } from "../logic/config.js";

export interface HudEnablement {
  canPlaceBet: boolean;
  canCancelBet: boolean;
  canCashOut: boolean;
  canEditBet: boolean;
  canEditAuto: boolean;
  chipsEnabled: boolean;
  showBroke: boolean;
}

/**
 * phase aware flags for one bet panel / slot
 * actionable phases are waiting | flying only
 * stake / chips / auto CO amount editable whenever no open bet is locked
 */
export function enablementFrom(
  snap: CrashSnapshot,
  bet: BetSnap,
): HudEnablement {
  const waiting = snap.phase === "waiting";
  const flying = snap.phase === "flying";
  const broke = snap.balance < CRASH_CONFIG.minBetCents / 100;
  const hasOpenBet = bet.amount != null && !bet.cashedOut;
  const hasLockedWaiting = waiting && hasOpenBet;
  const canEditStake = !hasOpenBet;

  return {
    canPlaceBet: waiting && bet.amount == null && !bet.cashedOut && !broke,
    canCancelBet: hasLockedWaiting,
    canEditBet: canEditStake,
    chipsEnabled: canEditStake,
    canCashOut: flying && hasOpenBet,
    canEditAuto: canEditStake,
    showBroke: broke,
  };
}
