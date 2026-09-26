/**
 * History strip helpers — bind only to snapshot.history (oldest→newest ring).
 * No parallel HUD store; safe DOM via createElement + textContent (no innerHTML).
 */

/** Pure newest-first order of an oldest→newest history ring. */
export function orderNewestFirst(history: readonly number[]): number[] {
  return [...history].reverse();
}

/** CSS class thresholds: &lt;2 low, 2–10 mid, &gt;10 high. */
export function historyClass(m: number): string {
  if (m < 2) return "hist hist--low";
  if (m <= 10) return "hist hist--mid";
  return "hist hist--high";
}

/**
 * Render crash multipliers newest-first into host (role=list).
 * Uses createElement + textContent only — never innerHTML.
 */
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
