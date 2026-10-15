import type { Rng } from "../../rng/createRng.js";
import type { HotlineConfig } from "../config/HotlineConfigSchema.js";

export type PrizeTable = {
  prizeMultipliers: number[];
  prizeWeights?: number[];
};

export function getPrizeTable(
  config: HotlineConfig,
  bonusId: string,
): PrizeTable {
  const row = config.features.bonusPrizes.find((b) => b.bonusId === bonusId);
  if (!row) {
    throw new Error(`prize table missing bonusId ${bonusId}`);
  }
  return {
    prizeMultipliers: row.prizeMultipliers.slice(),
    prizeWeights: row.prizeWeights ? row.prizeWeights.slice() : undefined,
  };
}

// weighted roll mirroring SlotEngine.pick with float fallback to last entry
export function weightedPick(
  rng: Rng,
  values: number[],
  weights: number[],
): number {
  if (values.length === 0) return 0;
  const w =
    weights.length === values.length
      ? weights
      : values.map(() => 1);
  const total = w.reduce((s, n) => s + n, 0);
  let roll = rng.next() * total;
  for (let i = 0; i < values.length; i++) {
    roll -= w[i];
    if (roll < 0) return values[i];
  }
  return values[values.length - 1];
}

export function drawPrizeMultiplier(rng: Rng, table: PrizeTable): number {
  const weights =
    table.prizeWeights && table.prizeWeights.length === table.prizeMultipliers.length
      ? table.prizeWeights
      : table.prizeMultipliers.map(() => 1);
  return weightedPick(rng, table.prizeMultipliers, weights);
}
