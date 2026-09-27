import type { Phase } from "../logic/index.js";

export type HudChromeMode = "normal" | "promote-cashout";

/**
 * Phase-driven HUD chrome mode (D-05–D-08).
 * Promote Cash out during flying and cashed_out (disabled still promoted).
 * Pure: no DOM, no pixi, no enablement coupling.
 */
export function chromeModeFrom(phase: Phase): HudChromeMode {
  if (phase === "flying" || phase === "cashed_out") {
    return "promote-cashout";
  }
  return "normal";
}
