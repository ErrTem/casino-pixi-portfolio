import type { Rng } from "../../../../shared/rng/createRng.js";
import type { HotlineConfig } from "../../config/HotlineConfigSchema.js";
import { TOKEN_COLOR_ORDER, type TokenColor } from "./TokenColors.js";

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

function pickFreeCell(
  rng: Rng,
  reels: number,
  rows: number,
  used: Set<number>,
): { reel: number; row: number } | null {
  const free: number[] = [];
  const total = reels * rows;
  for (let i = 0; i < total; i++) {
    if (!used.has(i)) free.push(i);
  }
  if (free.length === 0) return null;
  const pick = free[Math.floor(rng.next() * free.length)];
  return { reel: Math.floor(pick / rows), row: pick % rows };
}

// per color spawn roll, distinct cell among 20, pre-roll land trigger
export function resolveCollectors(args: ResolveCollectorsArgs): CollectorOutcome {
  const used = new Set<number>();
  const spawns: CollectorSpawn[] = [];
  for (const color of TOKEN_COLOR_ORDER) {
    if (args.rng.next() >= args.tokenOdds.perSpinChance[color]) continue;
    const cell = pickFreeCell(args.rng, args.reels, args.rows, used);
    if (!cell) continue;
    used.add(cell.reel * args.rows + cell.row);
    const triggers = args.rng.next() < args.tokenOdds.triggerChance[color];
    spawns.push({ color, cell, triggers });
  }
  const fired = new Set(spawns.filter((s) => s.triggers).map((s) => s.color));
  const queue = TOKEN_COLOR_ORDER.filter((c) => fired.has(c));
  return { spawns, queue };
}
