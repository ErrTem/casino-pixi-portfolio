import { describe, expect, it } from "vitest";
import type { BetSnap } from "../logic/index.js";
import { lastWinFromBets } from "./lastWin.js";

function bet(
  partial: Partial<BetSnap> = {},
): BetSnap {
  return {
    amount: null,
    cashOutAt: null,
    autoCashOutAt: null,
    cashedOut: false,
    ...partial,
  };
}

const emptyPair = (): [BetSnap, BetSnap] => [bet(), bet()];

describe("lastWinFromBets", () => {
  it("returns null when no slot newly cashes out", () => {
    const prev = emptyPair();
    const next = emptyPair();
    expect(lastWinFromBets(prev, next)).toBeNull();
  });

  it("returns amount * cashOutAt when a slot newly cashes out", () => {
    const prev = emptyPair();
    const next: [BetSnap, BetSnap] = [
      bet({ amount: 10, cashOutAt: 2.5, cashedOut: true }),
      bet(),
    ];
    expect(lastWinFromBets(prev, next)).toBe(25);
  });

  it("sums when both slots newly cash out same frame", () => {
    const prev = emptyPair();
    const next: [BetSnap, BetSnap] = [
      bet({ amount: 10, cashOutAt: 2, cashedOut: true }),
      bet({ amount: 5, cashOutAt: 3, cashedOut: true }),
    ];
    expect(lastWinFromBets(prev, next)).toBe(35);
  });

  it("ignores slots that were already cashed out", () => {
    const prev: [BetSnap, BetSnap] = [
      bet({ amount: 10, cashOutAt: 2, cashedOut: true }),
      bet(),
    ];
    const next: [BetSnap, BetSnap] = [
      bet({ amount: 10, cashOutAt: 2, cashedOut: true }),
      bet({ amount: 4, cashOutAt: 1.5, cashedOut: true }),
    ];
    expect(lastWinFromBets(prev, next)).toBe(6);
  });

  it("returns null when cashedOut without amount or cashOutAt", () => {
    const prev = emptyPair();
    const next: [BetSnap, BetSnap] = [
      bet({ cashedOut: true, amount: null, cashOutAt: null }),
      bet(),
    ];
    expect(lastWinFromBets(prev, next)).toBeNull();
  });
});
