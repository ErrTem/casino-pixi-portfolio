import type { HotlineConfig } from "../../config/HotlineConfigSchema.js";
import type { SpinEngineMath } from "../SpinEngine.js";

// reel 0 keeps base weights, reels 1..4 bump the wild weight from freeSpins.wildWeights
export function boostedFreeSpinMath(config: HotlineConfig): SpinEngineMath {
  const { math, features } = config;
  const wild = math.wildSymbolId;
  const symbolWeights = math.symbolWeights.map((weights, reel) =>
    reel === 0
      ? { ...weights }
      : { ...weights, [wild]: features.freeSpins.wildWeights[reel - 1] },
  );
  return { rows: math.rows, reels: math.reels, symbolWeights };
}

// green trigger odds become retriggerChance, nested colors can be zeroed
export function freeSpinTokenOdds(config: HotlineConfig): HotlineConfig["features"]["tokenOdds"] {
  const { tokenOdds, freeSpins } = config.features;
  return {
    ...tokenOdds,
    triggerChance: {
      green: freeSpins.retriggerChance,
      red: freeSpins.nested.red ? tokenOdds.triggerChance.red : 0,
      purple: freeSpins.nested.purple ? tokenOdds.triggerChance.purple : 0,
    },
  };
}
