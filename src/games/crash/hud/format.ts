/** Display-only money formatter (snapshot balance is already display units). */
export function formatMoney(balanceDisplay: number): string {
  if (!Number.isFinite(balanceDisplay)) return "—";
  return balanceDisplay.toFixed(2);
}

/** Display-only multiplier formatter. */
export function formatMult(m: number): string {
  if (!Number.isFinite(m)) return "—";
  return `${m.toFixed(2)}×`;
}
