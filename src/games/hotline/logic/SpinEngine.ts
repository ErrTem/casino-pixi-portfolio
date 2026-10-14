import { createRng, type Rng } from "../../../shared/rng/createRng.js";

export interface SpinEngineMath {
  rows: number;
  reels: number;
  symbolWeights: Record<string, number>[];
}

export class SpinEngine {
  private readonly rng: Rng;

  constructor(
    seed: string,
    private readonly math: SpinEngineMath,
  ) {
    this.rng = createRng(seed);
  }

  /** reel-major grid, grid[reel][row] */
  spin(): string[][] {
    const grid: string[][] = [];
    for (let reel = 0; reel < this.math.reels; reel++) {
      const column: string[] = [];
      for (let row = 0; row < this.math.rows; row++) {
        column.push(this.pick(this.math.symbolWeights[reel]));
      }
      grid.push(column);
    }
    return grid;
  }

  private pick(weights: Record<string, number>): string {
    const entries = Object.entries(weights);
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let roll = this.rng.next() * total;
    for (const [id, w] of entries) {
      roll -= w;
      if (roll < 0) return id;
    }
    return entries[entries.length - 1][0];
  }
}

export function createSpinEngine(seed: string, math: SpinEngineMath): SpinEngine {
  return new SpinEngine(seed, math);
}
