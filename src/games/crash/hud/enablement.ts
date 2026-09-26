import type { CrashSnapshot } from "../logic/index.js";
import { CRASH_CONFIG } from "../logic/config.js";

export interface HudEnablement {
  canPlaceBet: boolean;
  canCashOut: boolean;
  canEditBet: boolean;
  canEditAuto: boolean;
  chipsEnabled: boolean;
  showBroke: boolean;
}

/**
 * Phase-aware disabled flags for HUD controls.
 * Durable phases are waiting | flying only (settle → waiting).
 * Broke threshold uses display min (minBetCents / 100).
 */
export function enablementFrom(snap: CrashSnapshot): HudEnablement {
  const waiting = snap.phase === "waiting";
  const flying = snap.phase === "flying";
  const broke = snap.balance < CRASH_CONFIG.minBetCents / 100;
  const hasBet = snap.bet != null;

  return {
    canPlaceBet: waiting && !hasBet && !broke,
    canEditBet: waiting && !hasBet && !broke,
    chipsEnabled: waiting && !hasBet && !broke,
    canCashOut: flying && hasBet,
    canEditAuto: true,
    showBroke: broke,
  };
}
