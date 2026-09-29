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
 * True when Auto bet should call placeBet once this frame — never mid-wait re-place.
 */
export function shouldAutoPlaceBet(args: ShouldAutoPlaceBetArgs): boolean {
  if (!args.autoBetOn || args.broke || args.hasBet) return false;
  if (args.phase !== "waiting") return false;
  // Entered waiting this frame (or first observed frame).
  if (args.prevPhase !== "waiting") return true;
  // Mid-wait toggle ON with no bet — synthetic edge, place once.
  if (!args.prevAutoBetOn) return true;
  return false;
}
