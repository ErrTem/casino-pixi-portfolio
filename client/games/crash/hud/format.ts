export function formatMoney(balanceDisplay: number): string {
  if (!Number.isFinite(balanceDisplay)) return "-";
  return balanceDisplay.toFixed(2);
}

export function formatMult(m: number): string {
  if (!Number.isFinite(m)) return "-";
  return `${m.toFixed(2)}×`;
}
