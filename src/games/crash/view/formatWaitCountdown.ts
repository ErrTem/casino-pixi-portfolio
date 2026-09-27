/**
 * Waiting-theater countdown digits from waitRemainingMs (D-02 continuous tenths).
 * Pure helper — no Pixi / DOM / GameLogic imports. No × suffix (not a multiplier).
 */
export function formatWaitCountdown(waitRemainingMs: number): string {
  const ms = Math.max(0, waitRemainingMs);
  return (ms / 1000).toFixed(1);
}
