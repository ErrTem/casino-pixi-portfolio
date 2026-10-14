import {
  payoutCents as stakePayout,
  toMultHundredths,
  type Cents,
} from "../../../shared/money/cents.js";

export interface LineWin {
  lineIndex: number;
  symbolId: string;
  count: number;
  payoutCents: Cents;
  cells: { reel: number; row: number }[];
}

export type PayRow = Record<string, number>;

export interface EvaluateArgs {
  // reel-major grid, grid[reel][row]
  grid: string[][];
  paylines: number[][];
  paytable: Record<string, PayRow>;
  wildId: string;
  betCents: Cents;
}

interface Run {
  symbolId: string;
  count: number;
  payoutCents: Cents;
}

function pay(
  paytable: Record<string, PayRow>,
  symbolId: string,
  count: number,
  betCents: Cents,
): Cents {
  if (count < 3) return 0;
  const mult = paytable[symbolId]?.[String(count)];
  if (mult == null) return 0;
  return stakePayout(betCents, toMultHundredths(mult));
}

// leading wilds only, pays from the wild row of the paytable if it has one
function wildOnlyRun(
  symbols: string[],
  paytable: Record<string, PayRow>,
  wildId: string,
  betCents: Cents,
): Run {
  let count = 0;
  while (count < symbols.length && symbols[count] === wildId) count++;
  return {
    symbolId: wildId,
    count,
    payoutCents: pay(paytable, wildId, count, betCents),
  };
}

// first plain symbol sets the target, wilds before and after it substitute
function substitutedRun(
  symbols: string[],
  paytable: Record<string, PayRow>,
  wildId: string,
  betCents: Cents,
): Run | null {
  const target = symbols.find((s) => s !== wildId);
  if (target == null) return null;
  let count = 0;
  while (
    count < symbols.length &&
    (symbols[count] === target || symbols[count] === wildId)
  ) {
    count++;
  }
  return {
    symbolId: target,
    count,
    payoutCents: pay(paytable, target, count, betCents),
  };
}

/**
 * left to right consecutive wins from reel 0
 * each line pays the higher of the wild-only run and the substituted run
 */
export function evaluatePaylines(args: EvaluateArgs): LineWin[] {
  const { grid, paylines, paytable, wildId, betCents } = args;
  const wins: LineWin[] = [];

  paylines.forEach((line, lineIndex) => {
    const symbols = line.map((row, reel) => grid[reel][row]);
    const wild = wildOnlyRun(symbols, paytable, wildId, betCents);
    const sub = substitutedRun(symbols, paytable, wildId, betCents);

    // ties go to the substituted run
    const best = sub != null && sub.payoutCents >= wild.payoutCents ? sub : wild;
    if (best.payoutCents <= 0) return;

    wins.push({
      lineIndex,
      symbolId: best.symbolId,
      count: best.count,
      payoutCents: best.payoutCents,
      cells: line.slice(0, best.count).map((row, reel) => ({ reel, row })),
    });
  });

  return wins;
}
