import { describe, expect, it } from "vitest";
import { createRng } from "../../rng/createRng.js";
import { loadHotlineConfig } from "../config/loadHotlineConfig.js";
import {
  drawPrizeMultiplier,
  getPrizeTable,
  weightedPick,
} from "./prizeTable.js";

const config = loadHotlineConfig();

describe("getPrizeTable", () => {
  it("returns pickEm multipliers and weights from config", () => {
    const table = getPrizeTable(config, "pickEm");
    const row = config.features.bonusPrizes.find((b) => b.bonusId === "pickEm");
    expect(row).toBeTruthy();
    expect(table.prizeMultipliers).toEqual(row!.prizeMultipliers);
    expect(table.prizeWeights).toEqual(row!.prizeWeights);
  });
});

describe("weightedPick", () => {
  it("falls back to equal weights when weights are omitted length", () => {
    const values = [2, 3, 5];
    const equal = [1, 1, 1];
    const a = weightedPick(createRng("eq-a"), values, equal);
    const b = weightedPick(createRng("eq-a"), values, equal);
    expect(a).toBe(b);
    expect(values).toContain(a);
  });

  it("stays inside the value list for weighted draws", () => {
    const values = [2, 3, 5, 10, 25];
    const weights = [40, 28, 18, 10, 4];
    for (let i = 0; i < 40; i++) {
      const v = weightedPick(createRng(`w-${i}`), values, weights);
      expect(values).toContain(v);
    }
  });
});

describe("drawPrizeMultiplier", () => {
  it("draws from the table ladder with equal-weight fallback", () => {
    const table = { prizeMultipliers: [2, 3, 5] };
    const v = drawPrizeMultiplier(createRng("draw-eq"), table);
    expect(table.prizeMultipliers).toContain(v);
  });
});
