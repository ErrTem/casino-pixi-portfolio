import type { HotlineConfig } from "../config/HotlineConfigSchema.js";
import type { SlotEngineMath } from "../SlotEngine.js";

// reel 0 keeps base weights, reels 1..4 bump the wild weight from freeSpins.wildWeights
export function boostedFreeSpinMath(config: HotlineConfig): SlotEngineMath {
  const { math, features } = config;
  const wild = math.wildSymbolId;
  const symbolWeights = math.symbolWeights.map((weights, reel) =>
    reel === 0
      ? { ...weights }
      : { ...weights, [wild]: features.freeSpins.wildWeights[reel - 1] },
  );
  return { rows: math.rows, reels: math.reels, symbolWeights };
}

// fs uses the same spawn odds as base, retrigger and nested are handled in HotlineGame
export function freeSpinTokenOdds(config: HotlineConfig): HotlineConfig["features"]["tokenOdds"] {
  return config.features.tokenOdds;
}
