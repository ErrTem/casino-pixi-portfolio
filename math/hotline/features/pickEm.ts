import {
  payoutCents,
  toMultHundredths,
} from "../../money/cents.js";
import type { Rng } from "../../rng/createRng.js";
import type { HotlineConfig } from "../config/HotlineConfigSchema.js";
import { drawPrizeMultiplier, getPrizeTable } from "./prizeTable.js";

export type PickEmSnapshot = {
  lockers: number[];
  opened: number[];
  picksLeft: number;
};

export interface PickEm {
  pick(index: number): number | null;
  isDone(): boolean;
  totalCents(): number;
  snapshot(): PickEmSnapshot;
}

// twelve lockers pre-drawn on seed:pick, five reveals then done
export function createPickEm(args: {
  rng: Rng;
  config: HotlineConfig;
  betCents: number;
}): PickEm {
  const { rng, config, betCents } = args;
  const lockersCount = config.features.pickEm.lockers;
  const picksMax = config.features.pickEm.picks;
  const table = getPrizeTable(config, "pickEm");
  const lockers: number[] = [];
  for (let i = 0; i < lockersCount; i++) {
    lockers.push(drawPrizeMultiplier(rng, table));
  }

  const opened = new Set<number>();
  let picksLeft = picksMax;

  function isDone(): boolean {
    return picksLeft <= 0;
  }

  return {
    pick(index: number): number | null {
      if (!Number.isFinite(index)) return null;
      const i = Math.floor(index);
      if (isDone()) return null;
      if (i < 0 || i >= lockers.length) return null;
      if (opened.has(i)) return null;
      opened.add(i);
      picksLeft -= 1;
      return lockers[i];
    },

    isDone,

    totalCents(): number {
      let sum = 0;
      for (const i of opened) {
        sum += payoutCents(betCents, toMultHundredths(lockers[i]));
      }
      return sum;
    },

    snapshot(): PickEmSnapshot {
      return {
        lockers: lockers.slice(),
        opened: [...opened].sort((a, b) => a - b),
        picksLeft,
      };
    },
  };
}
