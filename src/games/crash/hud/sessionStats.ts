/** Session avg/max crash labels from history — RED stub (05-04). */

export interface SessionStats {
  avgLabel: string;
  maxLabel: string;
}

/** Pure helper — intentionally wrong until GREEN. */
export function sessionStatsFrom(_history: readonly number[]): SessionStats {
  return { avgLabel: "0.00×", maxLabel: "0.00×" };
}
