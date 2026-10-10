import type { Rng } from "../../../../shared/rng/createRng.js";
import type { HotlineConfig } from "../../config/HotlineConfigSchema.js";

export type JackpotTier = "mini" | "minor" | "major" | "grand";

export type HoldCell =
  | { kind: "cash"; mult: number }
  | { kind: "jackpot"; tier: Exclude<JackpotTier, "grand"> };

export type HoldSnapshot = {
  cells: Array<{ index: number; cell: HoldCell }>;
  lives: number;
  done: boolean;
  jackpotWon: JackpotTier | null;
};

export interface HoldAndWin {
  start(): void;
  respin(): void;
  totalCents(): number;
  snapshot(): HoldSnapshot;
  jackpotWon(): JackpotTier | null;
}

// stub for red: real sticky grid stepper lands in green
export function createHoldAndWin(_args: {
  rng: Rng;
  config: HotlineConfig;
  betCents: number;
}): HoldAndWin {
  return {
    start() {},
    respin() {},
    totalCents() {
      return 0;
    },
    snapshot() {
      return { cells: [], lives: 0, done: true, jackpotWon: null };
    },
    jackpotWon() {
      return null;
    },
  };
}
