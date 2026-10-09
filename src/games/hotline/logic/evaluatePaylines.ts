import type { Cents } from "../../../shared/money/cents.js";

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

export function evaluatePaylines(_args: EvaluateArgs): LineWin[] {
  return [];
}
