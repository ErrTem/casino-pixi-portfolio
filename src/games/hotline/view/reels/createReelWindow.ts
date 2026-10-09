import { Container } from "pixi.js";
import { createReelStrip, type ReelStrip } from "./ReelStrip.js";
import { staggerDelayMs } from "./reelMotion.js";

export interface ReelWindowOptions {
  reels: number;
  rows: number;
  fillerIds: string[];
  colorFor: (symbolId: string) => number;
  /** fires once per reel as it lands, left to right */
  onReelStop?: (reelIndex: number) => void;
}

export interface ReelWindow {
  container: Container;
  /** left and top of the first cell, cell is the square pitch in px */
  layout: (left: number, top: number, cell: number, gap: number) => void;
  /** show a settled grid, ignored while any reel moves */
  setGrid: (grid: string[][]) => void;
  /** spin all reels and land them on `grid`, one after another */
  start: (grid: string[][]) => void;
  update: (deltaMS: number) => void;
  isSpinning: () => boolean;
  destroy: () => void;
}

export function createReelWindow(options: ReelWindowOptions): ReelWindow {
  const { reels, rows, fillerIds, colorFor } = options;
  const container = new Container();
  const strips: ReelStrip[] = [];
  let pitch = 0;
  let left = 0;
  let top = 0;
  let destroyed = false;

  for (let reel = 0; reel < reels; reel += 1) {
    const strip = createReelStrip({
      rows,
      fillerIds,
      colorFor,
      onStop: () => {
        if (!destroyed) options.onReelStop?.(reel);
      },
    });
    container.addChild(strip.container);
    strips.push(strip);
  }

  return {
    container,

    layout(nextLeft: number, nextTop: number, cell: number, gap: number): void {
      if (destroyed) return;
      left = nextLeft;
      top = nextTop;
      pitch = cell;
      strips.forEach((strip, reel) => {
        strip.setSize(cell, gap);
        strip.container.position.set(left + reel * pitch, top);
      });
    },

    setGrid(grid: string[][]): void {
      if (destroyed) return;
      strips.forEach((strip, reel) => strip.setSymbols(grid[reel] ?? []));
    },

    start(grid: string[][]): void {
      if (destroyed) return;
      strips.forEach((strip, reel) => {
        strip.start(grid[reel] ?? [], staggerDelayMs(reel));
      });
    },

    update(deltaMS: number): void {
      if (destroyed) return;
      for (const strip of strips) strip.update(deltaMS);
    },

    isSpinning(): boolean {
      return strips.some((strip) => strip.isBusy());
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      for (const strip of strips) strip.destroy();
      strips.length = 0;
      container.removeFromParent();
      container.destroy({ children: true });
    },
  };
}
