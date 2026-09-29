import type { Phase } from "../logic/index.js";

export type HudChromeMode = "normal" | "promote-cashout";

/**
 * Legacy dual-button promote mode (Phase 4).
 * Phase 6 primary is always the large CTA via primaryChromeFrom — CrashHud no
 * longer toggles hud-bar--promote-cashout. Kept for existing unit tests until
 * a later cleanup removes promote-cashout entirely.
 */
export function chromeModeFrom(phase: Phase): HudChromeMode {
  if (phase === "flying" || phase === "cashed_out") {
    return "promote-cashout";
  }
  return "normal";
}
