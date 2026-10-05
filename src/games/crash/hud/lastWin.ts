import type { BetSnap } from "../logic/index.js";

export function lastWinFromBets(
  prevBets: readonly [BetSnap, BetSnap],
  nextBets: readonly [BetSnap, BetSnap],
): number | null {
  let sum = 0;
  let any = false;
  for (let i = 0; i < 2; i++) {
    const prev = prevBets[i];
    const next = nextBets[i];
    if (!next.cashedOut || prev.cashedOut) continue;
    if (next.amount == null || next.cashOutAt == null) continue;
    if (!Number.isFinite(next.amount) || !Number.isFinite(next.cashOutAt)) {
      continue;
    }
    sum += next.amount * next.cashOutAt;
    any = true;
  }
  return any ? sum : null;
}
