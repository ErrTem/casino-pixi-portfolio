import {
  payoutCents,
  toMultHundredths,
} from "../../../../shared/money/cents.js";
import type { Rng } from "../../../../shared/rng/createRng.js";
import type { HotlineConfig } from "../../config/HotlineConfigSchema.js";
import { drawPrizeMultiplier, getPrizeTable, weightedPick } from "./prizeTable.js";

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

const REELS = 5;
const ROWS = 4;
const TOTAL = REELS * ROWS;
const TIER_ORDER: Array<Exclude<JackpotTier, "grand">> = [
  "mini",
  "minor",
  "major",
];

function pickFreeIndex(rng: Rng, used: Set<number>): number | null {
  const free: number[] = [];
  for (let i = 0; i < TOTAL; i++) {
    if (!used.has(i)) free.push(i);
  }
  if (free.length === 0) return null;
  return free[Math.floor(rng.next() * free.length)];
}

// sticky cash / jackpot grid with respin lives on seed:hold
export function createHoldAndWin(args: {
  rng: Rng;
  config: HotlineConfig;
  betCents: number;
}): HoldAndWin {
  const { rng, config, betCents } = args;
  const knobs = config.features.holdAndWin;
  const jackpots = config.features.jackpotMultipliers;
  const table = getPrizeTable(config, "holdAndWin");
  const tierValues = TIER_ORDER.slice();
  const tierWeights = TIER_ORDER.map((t) => knobs.jackpotTierWeights[t]);

  const cells = new Map<number, HoldCell>();
  let lives = 0;
  let done = false;
  let jackpotWon: JackpotTier | null = null;
  let started = false;

  const tierRank: Record<JackpotTier, number> = {
    mini: 1,
    minor: 2,
    major: 3,
    grand: 4,
  };

  function noteJackpot(tier: JackpotTier): void {
    if (!jackpotWon || tierRank[tier] > tierRank[jackpotWon]) {
      jackpotWon = tier;
    }
  }

  function markDone(): void {
    done = true;
    if (cells.size === TOTAL) {
      noteJackpot("grand");
    }
  }

  function drawCell(): HoldCell {
    if (rng.next() < knobs.jackpotSymbolChance) {
      const idx = weightedPick(rng, [0, 1, 2], tierWeights);
      const tier = tierValues[idx] ?? "mini";
      noteJackpot(tier);
      return { kind: "jackpot", tier };
    }
    return { kind: "cash", mult: drawPrizeMultiplier(rng, table) };
  }

  function cellCents(cell: HoldCell): number {
    if (cell.kind === "cash") {
      return payoutCents(betCents, toMultHundredths(cell.mult));
    }
    return payoutCents(betCents, toMultHundredths(jackpots[cell.tier]));
  }

  return {
    start(): void {
      if (started) return;
      started = true;
      cells.clear();
      jackpotWon = null;
      done = false;
      lives = knobs.respins;
      const used = new Set<number>();
      const count = Math.min(knobs.startCells, TOTAL - 1);
      for (let n = 0; n < count; n++) {
        const idx = pickFreeIndex(rng, used);
        if (idx === null) break;
        used.add(idx);
        // start cells are cash only so the board opens readable
        cells.set(idx, {
          kind: "cash",
          mult: drawPrizeMultiplier(rng, table),
        });
      }
      if (cells.size === TOTAL) markDone();
    },

    respin(): void {
      if (!started || done) return;
      let landed = 0;
      for (let i = 0; i < TOTAL; i++) {
        if (cells.has(i)) continue;
        if (rng.next() >= knobs.landChance) continue;
        cells.set(i, drawCell());
        landed += 1;
      }
      if (landed > 0) {
        lives = knobs.respins;
      } else {
        lives -= 1;
      }
      if (cells.size === TOTAL || lives <= 0) {
        markDone();
      }
    },

    totalCents(): number {
      let sum = 0;
      for (const cell of cells.values()) {
        sum += cellCents(cell);
      }
      if (cells.size === TOTAL) {
        sum += payoutCents(betCents, toMultHundredths(jackpots.grand));
      }
      return sum;
    },

    snapshot(): HoldSnapshot {
      const list = [...cells.entries()]
        .map(([index, cell]) => ({ index, cell }))
        .sort((a, b) => a.index - b.index);
      return {
        cells: list,
        lives,
        done,
        jackpotWon,
      };
    },

    jackpotWon(): JackpotTier | null {
      return jackpotWon;
    },
  };
}
