/**
 * waiting theater countdown digits from waitRemainingMs
 */
export function formatWaitCountdown(waitRemainingMs: number): string {
  const ms = Math.max(0, waitRemainingMs);
  return (ms / 1000).toFixed(1);
}
