import type { Rng } from "../../../../shared/rng/createRng.js";
import type { HotlineConfig } from "../../config/HotlineConfigSchema.js";
import type { TokenColor } from "./TokenColors.js";

export interface CollectorSpawn {
  color: TokenColor;
  cell: { reel: number; row: number };
  triggers: boolean;
}

export interface CollectorOutcome {
  spawns: CollectorSpawn[];
  queue: TokenColor[];
}

export interface ResolveCollectorsArgs {
  rng: Rng;
  tokenOdds: HotlineConfig["features"]["tokenOdds"];
  reels: number;
  rows: number;
}

// stub for red phase, real spawn and trigger rolls land in green
export function resolveCollectors(_args: ResolveCollectorsArgs): CollectorOutcome {
  return { spawns: [], queue: [] };
}
