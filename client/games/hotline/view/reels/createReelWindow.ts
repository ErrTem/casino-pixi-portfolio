import { Container, type Texture } from "pixi.js";
import { createReelStrip, type ReelStrip } from "./ReelStrip.js";
import { staggerDelayMs } from "./reelMotion.js";

export interface ReelWindowOptions {
  reels: number;
  rows: number;
  fillerIds: string[];
  textureFor: (symbolId: string) => Texture | undefined;
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
  /** turbo shortens the stop stagger of the next spin */
  setTurbo: (on: boolean) => void;
  /** scale winning settled cells; ignores out-of-range indices */
  setWinScales: (
    cells: readonly { reel: number; row: number }[],
    scale: number,
  ) => void;
  clearWinScales: () => void;
  update: (deltaMS: number) => void;
  isSpinning: () => boolean;
  destroy: () => void;
}

export function createReelWindow(options: ReelWindowOptions): ReelWindow {
  const { reels, rows, fillerIds, textureFor } = options;
  const container = new Container();
  const strips: ReelStrip[] = [];
  let pitch = 0;
  let left = 0;
  let top = 0;
  let destroyed = false;
  let turbo = false;

  for (let reel = 0; reel < reels; reel += 1) {
    const strip = createReelStrip({
      rows,
      fillerIds,
      textureFor,
      fillerShift: reel * 3,
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
        strip.start(grid[reel] ?? [], staggerDelayMs(reel, turbo));
      });
    },

    setTurbo(on: boolean): void {
      if (destroyed) return;
      turbo = !!on;
    },

    setWinScales(
      cells: readonly { reel: number; row: number }[],
      scale: number,
    ): void {
      if (destroyed) return;
      for (const strip of strips) strip.clearWinScales();
      for (const cell of cells) {
        const strip = strips[cell.reel];
        if (!strip) continue;
        strip.setWinScale(cell.row, scale);
      }
    },

    clearWinScales(): void {
      if (destroyed) return;
      for (const strip of strips) strip.clearWinScales();
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
