// same two decimal display as the crash hud
export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return "-";
  return value.toFixed(2);
}

// win callout on the reels, cents in and a dollar amount out
export function formatWinCallout(cents: number): string {
  if (!Number.isFinite(cents)) return "-";
  return `$${formatMoney(cents / 100)}`;
}
