import type { CrashSnapshot } from "../logic/index.js";
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
 * Phase-aware disabled flags for HUD controls.
 * Actionable phases are waiting | flying only.
 * cashed_out is a durable spectator phase and is not actionable (D-16).
 * Broke threshold uses display min (minBetCents / 100).
 */
export function enablementFrom(snap: CrashSnapshot): HudEnablement {
  const waiting = snap.phase === "waiting";
  const flying = snap.phase === "flying";
  const broke = snap.balance < CRASH_CONFIG.minBetCents / 100;
  const hasBet = snap.bet != null;

  return {
    canPlaceBet: waiting && !hasBet && !broke,
    canCancelBet: waiting && hasBet,
    canEditBet: waiting && !hasBet && !broke,
    chipsEnabled: waiting && !hasBet && !broke,
    canCashOut: flying && hasBet,
    // Auto CO field editability is further gated by the HUD toggle (D-04).
    canEditAuto: true,
    showBroke: broke,
  };
}
