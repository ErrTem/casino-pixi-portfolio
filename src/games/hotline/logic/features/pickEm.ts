import type { Rng } from "../../../../shared/rng/createRng.js";
import type { HotlineConfig } from "../../config/HotlineConfigSchema.js";

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

// stub for red: real twelve-locker machine lands in green
export function createPickEm(_args: {
  rng: Rng;
  config: HotlineConfig;
  betCents: number;
}): PickEm {
  return {
    pick() {
      return null;
    },
    isDone() {
      return false;
    },
    totalCents() {
      return 0;
    },
    snapshot() {
      return { lockers: [], opened: [], picksLeft: 0 };
    },
  };
}
