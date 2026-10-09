// same two decimal display as the crash hud
export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return "-";
  return value.toFixed(2);
}
