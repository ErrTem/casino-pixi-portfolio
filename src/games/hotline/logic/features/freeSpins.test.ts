import { describe, expect, it } from "vitest";
import { loadHotlineConfig } from "../../config/loadHotlineConfig.js";
import { boostedFreeSpinMath, freeSpinTokenOdds } from "./freeSpins.js";

const config = loadHotlineConfig();

describe("boostedFreeSpinMath", () => {
  it("keeps reel 0 weights identical and boosts wild on reels 1..4", () => {
    const boosted = boostedFreeSpinMath(config);
    const wild = config.math.wildSymbolId;
    expect(boosted.symbolWeights[0]).toEqual(config.math.symbolWeights[0]);
    for (let reel = 1; reel <= 4; reel++) {
      expect(boosted.symbolWeights[reel][wild]).toBe(
        config.features.freeSpins.wildWeights[reel - 1],
      );
      expect(boosted.symbolWeights[reel][wild]).toBeGreaterThan(
        config.math.symbolWeights[reel][wild],
      );
      for (const id of Object.keys(config.math.symbolWeights[reel])) {
        if (id === wild) continue;
        expect(boosted.symbolWeights[reel][id]).toBe(
          config.math.symbolWeights[reel][id],
        );
      }
    }
  });
});

describe("freeSpinTokenOdds", () => {
  it("sets green to retriggerChance and zeroes nested colors when disabled", () => {
    const disabled = {
      ...config,
      features: {
        ...config.features,
        freeSpins: {
          ...config.features.freeSpins,
          retriggerChance: 0.25,
          nested: { red: false, purple: false },
        },
      },
    };
    const odds = freeSpinTokenOdds(disabled);
    expect(odds.triggerChance.green).toBe(0.25);
    expect(odds.triggerChance.red).toBe(0);
    expect(odds.triggerChance.purple).toBe(0);
    expect(odds.perSpinChance).toEqual(config.features.tokenOdds.perSpinChance);
  });

  it("keeps red and purple trigger odds when nested is enabled", () => {
    const odds = freeSpinTokenOdds(config);
    expect(odds.triggerChance.green).toBe(config.features.freeSpins.retriggerChance);
    expect(odds.triggerChance.red).toBe(config.features.tokenOdds.triggerChance.red);
    expect(odds.triggerChance.purple).toBe(
      config.features.tokenOdds.triggerChance.purple,
    );
  });
});
