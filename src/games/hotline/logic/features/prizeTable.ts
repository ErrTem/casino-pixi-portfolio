import type { Rng } from "../../../../shared/rng/createRng.js";
import type { HotlineConfig } from "../../config/HotlineConfigSchema.js";

export type PrizeTable = {
  prizeMultipliers: number[];
  prizeWeights?: number[];
};

// stub for red: real weighted ladder lands in green
export function getPrizeTable(
  _config: HotlineConfig,
  _bonusId: string,
): PrizeTable {
  return { prizeMultipliers: [] };
}

export function weightedPick(
  _rng: Rng,
  values: number[],
  _weights: number[],
): number {
  return values[0] ?? 0;
}

export function drawPrizeMultiplier(_rng: Rng, table: PrizeTable): number {
  return table.prizeMultipliers[0] ?? 0;
}
