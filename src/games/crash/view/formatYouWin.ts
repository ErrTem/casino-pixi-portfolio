/**
 * theater win banner string from a display payout amount
 * two lines so the placard fits narrow mobile widths
 */
export function formatYouWin(amountDisplay: number): string {
  if (!Number.isFinite(amountDisplay)) return "you win\n$-";
  return `you win\n$${amountDisplay.toFixed(2)}`;
}
