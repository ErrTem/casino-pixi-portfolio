import { Container, Graphics, Text } from "pixi.js";
import type { HoldSnapshot } from "../logic/features/holdAndWin.js";
import type { WinGeometry } from "./WinLinesOverlay.js";

export interface HoldLayer {
  container: Container;
  sync: (snapshot: HoldSnapshot, geometry: WinGeometry) => void;
  tick: (deltaMS: number) => void;
  setFlicker: (on: boolean) => void;
  destroy: () => void;
}

const FRAME_NEON = 0xff2e93;
const CASH_FILL = 0xffe3f1;
const EMPTY_NEON = 0x39ffe8;
const JACKPOT_FILL = 0xffd24a;
const FLICKER_MS = 120;

function cellLabel(cell: HoldSnapshot["cells"][number]["cell"]): string {
  if (cell.kind === "cash") return `x${cell.mult}`;
  const map = { mini: "MIN", minor: "MID", major: "MAX" } as const;
  return map[cell.tier];
}

// sticky 5x4 overlay aligned to crt glass geometry
export function createHoldLayer(fontFamily: string): HoldLayer {
  const container = new Container();
  const frames = new Graphics();
  container.addChild(frames);
  container.visible = false;

  const labels: Text[] = [];
  for (let i = 0; i < 20; i++) {
    const label = new Text({
      text: "",
      style: {
        fontFamily,
        fontSize: 14,
        fontWeight: "bold",
        fill: CASH_FILL,
      },
    });
    label.anchor.set(0.5);
    label.visible = false;
    container.addChild(label);
    labels.push(label);
  }

  let destroyed = false;
  let flicker = false;
  let flickerClock = 0;
  let emptyIndexes: number[] = [];
  let lastGeo: WinGeometry | null = null;
  let lastSnap: HoldSnapshot | null = null;

  function draw(): void {
    frames.clear();
    if (!lastGeo || !lastSnap) return;
    const { centers, cellSize, gap } = lastGeo;
    const size = Math.max(4, cellSize - gap);
    const filled = new Map(lastSnap.cells.map((c) => [c.index, c.cell]));
    emptyIndexes = [];

    for (let reel = 0; reel < 5; reel++) {
      for (let row = 0; row < 4; row++) {
        const index = reel * 4 + row;
        const p = centers[reel][row];
        const cell = filled.get(index);
        const label = labels[index];
        const pulse =
          flicker && !cell
            ? 0.35 + 0.35 * Math.abs(Math.sin(flickerClock / FLICKER_MS))
            : cell
              ? 0.95
              : 0.35;
        const stroke = cell
          ? cell.kind === "jackpot"
            ? JACKPOT_FILL
            : FRAME_NEON
          : EMPTY_NEON;
        frames
          .roundRect(p.x - size / 2, p.y - size / 2, size, size, 6)
          .stroke({ width: 3, color: stroke, alpha: pulse });

        if (cell) {
          label.text = cellLabel(cell);
          label.style.fill =
            cell.kind === "jackpot" ? JACKPOT_FILL : CASH_FILL;
          label.style.fontSize = Math.max(10, Math.min(18, size * 0.32));
          label.position.set(p.x, p.y);
          label.visible = true;
        } else {
          label.visible = false;
          emptyIndexes.push(index);
        }
      }
    }
  }

  return {
    container,

    sync(snapshot: HoldSnapshot, geometry: WinGeometry): void {
      if (destroyed) return;
      lastSnap = snapshot;
      lastGeo = geometry;
      draw();
    },

    tick(deltaMS: number): void {
      if (destroyed || !flicker) return;
      if (!Number.isFinite(deltaMS) || deltaMS <= 0) return;
      flickerClock += Math.min(deltaMS, 100);
      if (emptyIndexes.length > 0) draw();
    },

    setFlicker(on: boolean): void {
      if (destroyed) return;
      flicker = on;
      if (!on) flickerClock = 0;
      draw();
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      container.removeFromParent();
      container.destroy({ children: true });
    },
  };
}
