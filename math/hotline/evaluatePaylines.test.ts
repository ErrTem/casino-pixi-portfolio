import { describe, expect, it } from "vitest";
import { evaluatePaylines } from "./evaluatePaylines.js";

const PAYTABLE = {
  ace: { "3": 2, "4": 6, "5": 20 },
  king: { "3": 1.5, "4": 5, "5": 15 },
  mask: { "3": 10, "4": 40, "5": 200 },
};

// build a reel-major grid where only row 0 matters for the flat line
function rowZero(symbols: string[]): string[][] {
  return symbols.map((s) => [s, "pad", "pad", "pad"]);
}

const FLAT = [[0, 0, 0, 0, 0]];
const BET = 100;

function run(symbols: string[], paylines = FLAT, bet = BET) {
  return evaluatePaylines({
    grid: rowZero(symbols),
    paylines,
    paytable: PAYTABLE,
    wildId: "mask",
    betCents: bet,
  });
}

describe("evaluatePaylines", () => {
  it("pays three matching symbols from reel 0 as multiplier times bet", () => {
    const wins = run(["ace", "ace", "ace", "king", "pad"]);
    expect(wins).toHaveLength(1);
    expect(wins[0]).toMatchObject({
      lineIndex: 0,
      symbolId: "ace",
      count: 3,
      payoutCents: 200,
    });
    expect(wins[0].cells).toEqual([
      { reel: 0, row: 0 },
      { reel: 1, row: 0 },
      { reel: 2, row: 0 },
    ]);
  });

  it("pays longer runs from the match length row", () => {
    expect(run(["king", "king", "king", "king", "pad"])[0].payoutCents).toBe(500);
    expect(run(["king", "king", "king", "king", "king"])[0].payoutCents).toBe(1500);
  });

  it("lets wild substitute for a paying symbol", () => {
    const wins = run(["mask", "ace", "ace", "king", "pad"]);
    expect(wins).toHaveLength(1);
    expect(wins[0]).toMatchObject({ symbolId: "ace", count: 3, payoutCents: 200 });
  });

  it("lets wild sit in the middle of a run", () => {
    const wins = run(["ace", "mask", "ace", "ace", "pad"]);
    expect(wins[0]).toMatchObject({ symbolId: "ace", count: 4, payoutCents: 600 });
  });

  it("takes the substituted run when it beats wild only", () => {
    const wins = run(["mask", "mask", "mask", "ace", "ace"]);
    expect(wins).toHaveLength(1);
    expect(wins[0]).toMatchObject({ symbolId: "ace", count: 5, payoutCents: 2000 });
  });

  it("takes the wild only run when it beats the substituted run", () => {
    const wins = run(["mask", "mask", "mask", "mask", "ace"]);
    expect(wins).toHaveLength(1);
    expect(wins[0]).toMatchObject({ symbolId: "mask", count: 4, payoutCents: 4000 });
  });

  it("pays five wilds from the wild row", () => {
    const wins = run(["mask", "mask", "mask", "mask", "mask"]);
    expect(wins[0]).toMatchObject({ symbolId: "mask", count: 5, payoutCents: 20000 });
  });

  it("does not pay a run that starts after reel 0", () => {
    expect(run(["pad", "ace", "ace", "ace", "ace"])).toEqual([]);
  });

  it("stops at the first break and ignores symbols after the gap", () => {
    expect(run(["ace", "ace", "king", "ace", "ace"])).toEqual([]);
    const wins = run(["ace", "ace", "ace", "king", "ace"]);
    expect(wins[0]).toMatchObject({ count: 3, payoutCents: 200 });
  });

  it("does not pay a two symbol run", () => {
    expect(run(["ace", "ace", "pad", "pad", "pad"])).toEqual([]);
    expect(run(["mask", "ace", "pad", "pad", "pad"])).toEqual([]);
  });

  it("follows row indices of each payline", () => {
    const grid = [
      ["pad", "ace", "pad", "pad"],
      ["pad", "pad", "ace", "pad"],
      ["pad", "pad", "pad", "ace"],
      ["king", "pad", "pad", "pad"],
      ["king", "pad", "pad", "pad"],
    ];
    const wins = evaluatePaylines({
      grid,
      paylines: [
        [0, 0, 0, 0, 0],
        [1, 2, 3, 0, 0],
      ],
      paytable: PAYTABLE,
      wildId: "mask",
      betCents: BET,
    });
    expect(wins).toHaveLength(1);
    expect(wins[0]).toMatchObject({ lineIndex: 1, symbolId: "ace", count: 3 });
  });

  it("sums independent line wins and keeps line indexes", () => {
    const wins = run(
      ["ace", "ace", "ace", "pad", "pad"],
      [
        [0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 1, 1],
      ],
    );
    expect(wins.map((w) => w.lineIndex)).toEqual([0, 2]);
    expect(wins.reduce((s, w) => s + w.payoutCents, 0)).toBe(400);
  });

  it("floors fractional multipliers to whole cents", () => {
    const wins = evaluatePaylines({
      grid: rowZero(["ten", "ten", "ten", "pad", "pad"]),
      paylines: FLAT,
      paytable: { ten: { "3": 0.5, "4": 2, "5": 6 } },
      wildId: "mask",
      betCents: 15,
    });
    expect(wins[0].payoutCents).toBe(7);
  });
});
