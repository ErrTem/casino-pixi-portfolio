/**
 * Soft session avg/max crash labels from snapshot.history (PLSH-04 / D-13 / D-16).
 * Pure helper — no DOM, no Pixi.
 */

export interface SessionStats {
  avgLabel: string;
  maxLabel: string;
}

const EMPTY: SessionStats = { avgLabel: "—", maxLabel: "n/a" };

function formatMultLabel(n: number): string {
  return `${n.toFixed(2)}×`;
}

/** Avg + max crash × from history; empty / no-finite → — / n/a (never 0.00×). */
export function sessionStatsFrom(history: readonly number[]): SessionStats {
  if (history.length === 0) return EMPTY;

  let sum = 0;
  let count = 0;
  let max = -Infinity;
  for (const m of history) {
    if (!Number.isFinite(m)) continue;
    sum += m;
    count += 1;
    if (m > max) max = m;
  }
  if (count === 0) return EMPTY;

  const avg = sum / count;
  return {
    avgLabel: formatMultLabel(avg),
    maxLabel: formatMultLabel(max),
  };
}
