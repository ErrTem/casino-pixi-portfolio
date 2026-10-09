import { Container, Graphics, type Application } from "pixi.js";
import type { HotlineConfig } from "../config/HotlineConfigSchema.js";
import type { HotlineSnapshot } from "../logic/index.js";
import { createReelWindow } from "./reels/createReelWindow.js";

export interface HotlineSceneHooks {
  /** fires as each reel lands, left to right */
  onReelStop?: (reelIndex: number) => void;
}

export interface HotlineScene {
  sync: (snapshot: HotlineSnapshot, deltaMS: number) => void;
  /** spin the reels and land them on `grid` */
  startSpin: (grid: string[][]) => void;
  isSpinning: () => boolean;
  destroy: () => void;
}

// temporary tracer art, real symbol textures come with the presentation plan
const PALETTE = [
  0xff2e93, 0x00e5ff, 0xffd400, 0x7cff4d, 0xb26bff, 0xff7a1a, 0x3d7bff,
  0xe8e8f0, 0xff4d4d, 0x4dffd2,
];
const PHONE_COLORS = [0xff2e93, 0x00e5ff, 0xffd400];
const WIN_OUTLINE = 0xffffff;
const CELL_GAP = 4;

function snapshotKey(snap: HotlineSnapshot): string {
  const wins = snap.lineWins.map((w) => `${w.lineIndex}:${w.count}`).join(",");
  return `${snap.grid.map((reel) => reel.join(",")).join("|")}#${wins}`;
}

export function createHotlineScene(
  app: Application,
  config: HotlineConfig,
  hooks: HotlineSceneHooks = {},
): HotlineScene {
  const { reels, rows, symbolWeights } = config.math;
  const symbolIds = Object.keys(symbolWeights[0]);
  const colorFor = (id: string): number => {
    const at = symbolIds.indexOf(id);
    return PALETTE[(at < 0 ? symbolIds.length : at) % PALETTE.length];
  };

  const root = new Container();
  const phones = new Graphics();
  const reelWindow = createReelWindow({
    reels,
    rows,
    fillerIds: symbolIds,
    colorFor,
    onReelStop: hooks.onReelStop,
  });
  // win outlines sit above the masked reels
  const outlines = new Graphics();
  root.addChild(phones, reelWindow.container, outlines);
  app.stage.addChild(root);

  let destroyed = false;
  let lastKey = "";
  let lastW = 0;
  let lastH = 0;
  let lastSpinning = false;
  let gridLeft = 0;
  let gridTop = 0;
  let cellSize = 0;

  function layout(w: number, h: number): void {
    const phoneBand = Math.min(h * 0.16, 72);
    const margin = 12;
    const availW = Math.max(1, w - margin * 2);
    const availH = Math.max(1, h - phoneBand - margin * 2);
    cellSize = Math.max(8, Math.min(availW / reels, availH / rows));
    gridLeft = (w - cellSize * reels) / 2;
    gridTop = phoneBand + margin + (availH - cellSize * rows) / 2;
    reelWindow.layout(gridLeft, gridTop, cellSize, CELL_GAP);

    // three phone slots above the reels
    phones.clear();
    const r = Math.min(phoneBand * 0.36, 26);
    PHONE_COLORS.forEach((color, i) => {
      const cx = w * ((i + 1) / (PHONE_COLORS.length + 1));
      phones.circle(cx, phoneBand / 2 + 4, r).fill(color);
    });
  }

  function drawOutlines(snap: HotlineSnapshot, spinning: boolean): void {
    outlines.clear();
    if (spinning) return;
    const size = cellSize - CELL_GAP;
    const drawn = new Set<number>();
    for (const win of snap.lineWins) {
      for (const c of win.cells) {
        const idx = c.reel * rows + c.row;
        if (drawn.has(idx)) continue;
        drawn.add(idx);
        const x = gridLeft + c.reel * cellSize + CELL_GAP / 2;
        const y = gridTop + c.row * cellSize + CELL_GAP / 2;
        outlines.roundRect(x, y, size, size, 6).stroke({
          width: 3,
          color: WIN_OUTLINE,
        });
      }
    }
  }

  return {
    sync(snapshot: HotlineSnapshot, deltaMS: number): void {
      if (destroyed) return;
      const w = app.screen.width;
      const h = app.screen.height;
      const resized = w !== lastW || h !== lastH;
      if (resized) {
        lastW = w;
        lastH = h;
        layout(w, h);
      }

      reelWindow.update(deltaMS);
      const spinning = reelWindow.isSpinning();
      const key = snapshotKey(snapshot);
      if (
        resized ||
        key !== lastKey ||
        spinning !== lastSpinning
      ) {
        lastKey = key;
        lastSpinning = spinning;
        if (!spinning) reelWindow.setGrid(snapshot.grid);
        drawOutlines(snapshot, spinning);
      }
    },

    startSpin(grid: string[][]): void {
      if (destroyed) return;
      reelWindow.start(grid);
      outlines.clear();
    },

    isSpinning(): boolean {
      return reelWindow.isSpinning();
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      reelWindow.destroy();
      root.removeFromParent();
      root.destroy({ children: true });
    },
  };
}
