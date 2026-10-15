/** true when the center win callout should run for this settle */
export function shouldShowWinCallout(
  lineWins: readonly { payoutCents: number }[],
): boolean {
  let total = 0;
  for (const w of lineWins) total += w.payoutCents;
  return total > 0;
}
