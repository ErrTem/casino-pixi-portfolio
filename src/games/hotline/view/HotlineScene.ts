import { Container, Graphics, type Application } from "pixi.js";
import type { HotlineConfig } from "../config/HotlineConfigSchema.js";
import type { HotlineSnapshot } from "../logic/index.js";
import { createReelWindow } from "./reels/createReelWindow.js";
import { createWinLinesOverlay, type WinGeometry } from "./WinLinesOverlay.js";

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
  // win lines and cell frames sit above the masked reels
  const overlay = createWinLinesOverlay();
  root.addChild(phones, reelWindow.container, overlay.container);
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

  function geometry(): WinGeometry {
    const centers = Array.from({ length: reels }, (_, reel) =>
      Array.from({ length: rows }, (_, row) => ({
        x: gridLeft + reel * cellSize + cellSize / 2,
        y: gridTop + row * cellSize + cellSize / 2,
      })),
    );
    return {
      centers,
      cellSize,
      gap: CELL_GAP,
      callout: {
        x: gridLeft + (cellSize * reels) / 2,
        y: gridTop + cellSize * rows - Math.min(24, cellSize * 0.3),
      },
    };
  }

  // wins show only once every reel is at rest, one payline at a time
  function showWins(snap: HotlineSnapshot, spinning: boolean): void {
    if (spinning || snap.lineWins.length === 0) {
      overlay.clear();
      return;
    }
    overlay.showCycle(snap.lineWins, geometry());
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
        showWins(snapshot, spinning);
      }
      if (!spinning) overlay.tick(deltaMS);
    },

    startSpin(grid: string[][]): void {
      if (destroyed) return;
      reelWindow.start(grid);
      overlay.clear();
    },

    isSpinning(): boolean {
      return reelWindow.isSpinning();
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      overlay.destroy();
      reelWindow.destroy();
      root.removeFromParent();
      root.destroy({ children: true });
    },
  };
}
