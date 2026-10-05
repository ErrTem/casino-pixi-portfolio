import type { Phase } from "../logic/index.js";

export interface ShouldAutoPlaceBetArgs {
  autoBetOn: boolean;
  prevAutoBetOn: boolean;
  phase: Phase;
  prevPhase: Phase | null;
  hasBet: boolean;
  broke: boolean;
}

export function shouldAutoPlaceBet(args: ShouldAutoPlaceBetArgs): boolean {
  if (!args.autoBetOn || args.broke || args.hasBet) return false;
  if (args.phase !== "waiting") return false;
  if (args.prevPhase !== "waiting") return true;
  if (!args.prevAutoBetOn) return true;
  return false;
}
