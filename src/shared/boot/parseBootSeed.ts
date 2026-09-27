/**
 * Boot-only URL seed parser (PLSH-03 / D-10 / D-12).
 * Pure helper — no DOM, Pixi, or GameLogic imports.
 * RED stub: returns a wrong seed so boundary tests fail until GREEN.
 */
export const DEFAULT_DEMO_SEED = "portfolio-demo";

export function parseBootSeed(
  _search: string,
  _fallback = DEFAULT_DEMO_SEED,
): { seed: string; fromQuery: boolean; invalid: boolean } {
  return { seed: "RED-STUB", fromQuery: false, invalid: false };
}
