import { Container, Graphics, Text, type Application } from "pixi.js";
import type { HotlineConfig } from "../config/HotlineConfigSchema.js";
import type { HotlineSnapshot } from "../logic/index.js";

export interface HotlineScene {
  sync: (snapshot: HotlineSnapshot) => void;
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

interface Cell {
  box: Graphics;
  label: Text;
}

function snapshotKey(snap: HotlineSnapshot): string {
  const wins = snap.lineWins.map((w) => `${w.lineIndex}:${w.count}`).join(",");
  return `${snap.grid.map((reel) => reel.join(",")).join("|")}#${wins}`;
}

export function createHotlineScene(
  app: Application,
  config: HotlineConfig,
): HotlineScene {
  const { reels, rows, symbolWeights } = config.math;
  const symbolIds = Object.keys(symbolWeights[0]);
  const colorFor = (id: string): number => {
    const at = symbolIds.indexOf(id);
    return PALETTE[(at < 0 ? symbolIds.length : at) % PALETTE.length];
  };

  const root = new Container();
  const phones = new Graphics();
  const cells: Cell[] = [];
  root.addChild(phones);
  for (let reel = 0; reel < reels; reel += 1) {
    for (let row = 0; row < rows; row += 1) {
      const box = new Graphics();
      const label = new Text({
        text: "",
        style: { fontFamily: "sans-serif", fontSize: 14, fill: 0x0b0b12 },
      });
      label.anchor.set(0.5);
      root.addChild(box, label);
      cells.push({ box, label });
    }
  }
  app.stage.addChild(root);

  let destroyed = false;
  let lastKey = "";
  let lastW = 0;
  let lastH = 0;
  let lastSnap: HotlineSnapshot | null = null;

  function draw(snap: HotlineSnapshot, w: number, h: number): void {
    const phoneBand = Math.min(h * 0.16, 72);
    const margin = 12;
    const availW = Math.max(1, w - margin * 2);
    const availH = Math.max(1, h - phoneBand - margin * 2);
    const cell = Math.max(8, Math.min(availW / reels, availH / rows));
    const gridW = cell * reels;
    const gridH = cell * rows;
    const left = (w - gridW) / 2;
    const top = phoneBand + margin + (availH - gridH) / 2;

    // three phone slots above the reels
    phones.clear();
    const r = Math.min(phoneBand * 0.36, 26);
    PHONE_COLORS.forEach((color, i) => {
      const cx = w * ((i + 1) / (PHONE_COLORS.length + 1));
      phones.circle(cx, phoneBand / 2 + 4, r).fill(color);
    });

    const winCells = new Set<number>();
    for (const win of snap.lineWins) {
      for (const c of win.cells) winCells.add(c.reel * rows + c.row);
    }

    for (let reel = 0; reel < reels; reel += 1) {
      for (let row = 0; row < rows; row += 1) {
        const idx = reel * rows + row;
        const { box, label } = cells[idx];
        const id = snap.grid[reel]?.[row] ?? "";
        const x = left + reel * cell + CELL_GAP / 2;
        const y = top + row * cell + CELL_GAP / 2;
        const size = cell - CELL_GAP;
        box.clear();
        box.roundRect(x, y, size, size, 6).fill(colorFor(id));
        if (winCells.has(idx)) {
          box.roundRect(x, y, size, size, 6).stroke({
            width: 3,
            color: WIN_OUTLINE,
          });
        }
        label.text = id;
        label.style.fontSize = Math.max(8, Math.floor(size * 0.18));
        label.position.set(x + size / 2, y + size / 2);
      }
    }
  }

  return {
    sync(snapshot: HotlineSnapshot): void {
      if (destroyed) return;
      const w = app.screen.width;
      const h = app.screen.height;
      const key = snapshotKey(snapshot);
      lastSnap = snapshot;
      if (key === lastKey && w === lastW && h === lastH) return;
      lastKey = key;
      lastW = w;
      lastH = h;
      draw(lastSnap, w, h);
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      root.removeFromParent();
      root.destroy({ children: true });
    },
  };
}
