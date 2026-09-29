import type { Phase } from "../logic/index.js";

export interface ShouldAutoPlaceBetArgs {
  autoBetOn: boolean;
  /** Previous-frame Auto bet flag — rising edge (false→true) is a synthetic place once. */
  prevAutoBetOn: boolean;
  phase: Phase;
  prevPhase: Phase | null;
  hasBet: boolean;
  broke: boolean;
}

/**
 * Pure waiting-edge / toggle-ON gate for session Auto bet (D-10..D-13).
 * Stub — always false until GREEN.
 */
export function shouldAutoPlaceBet(_args: ShouldAutoPlaceBetArgs): boolean {
  return false;
}
