export function orderNewestFirst(history: readonly number[]): number[] {
  return [...history].reverse();
}

export function historyClass(m: number): string {
  if (m < 2) return "hist hist--low";
  if (m <= 10) return "hist hist--mid";
  return "hist hist--high";
}

export function renderHistoryStrip(
  host: Element,
  history: readonly number[],
): void {
  host.replaceChildren();
  for (const m of orderNewestFirst(history)) {
    const el = document.createElement("span");
    el.setAttribute("role", "listitem");
    el.className = historyClass(m);
    el.textContent = `${m.toFixed(2)}×`;
    host.appendChild(el);
  }
}
