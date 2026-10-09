import { Container, Graphics, Text } from "pixi.js";
import type { LineWin } from "../logic/evaluatePaylines.js";
import { formatMoney } from "../hud/format.js";
import { createWinCycle } from "./winCycle.js";

export interface WinGeometry {
  /** centers[reel][row] in scene px */
  centers: { x: number; y: number }[][];
  /** square cell pitch in px */
  cellSize: number;
  /** gap between cells in px */
  gap: number;
  /** middle of the callout pill */
  callout: { x: number; y: number };
}

export interface WinLinesOverlay {
  container: Container;
  /** start cycling `wins` one payline at a time, empty list clears */
  showCycle: (wins: readonly LineWin[], geometry: WinGeometry) => void;
  tick: (deltaMS: number) => void;
  clear: () => void;
  destroy: () => void;
}

// hotline pink, not the witch pots green
const NEON = 0xff2e93;
const NEON_CORE = 0xffe3f1;
const CYCLE_MS = 1100;
const PULSE_MS = 700;

function formatCents(cents: number): string {
  return formatMoney(cents / 100);
}

export function createWinLinesOverlay(): WinLinesOverlay {
  const container = new Container();
  const frames = new Graphics();
  const glow = new Graphics();
  const halo = new Graphics();
  const core = new Graphics();
  const pill = new Graphics();
  const label = new Text({
    text: "",
    style: {
      fontFamily: "sans-serif",
      fontSize: 16,
      fontWeight: "bold",
      fill: NEON_CORE,
    },
  });
  label.anchor.set(0.5);
  container.addChild(frames, glow, halo, core, pill, label);
  container.visible = false;

  const cycle = createWinCycle(CYCLE_MS);
  let wins: readonly LineWin[] = [];
  let geometry: WinGeometry | null = null;
  let pulse = 0;
  let destroyed = false;

  function strokePath(
    g: Graphics,
    points: { x: number; y: number }[],
    width: number,
    alpha: number,
    color: number,
  ): void {
    if (points.length < 2) return;
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) g.lineTo(points[i].x, points[i].y);
    g.stroke({ width, color, alpha, cap: "round", join: "round" });
  }

  // redraws only when the active line changes, not every frame
  function draw(): void {
    frames.clear();
    glow.clear();
    halo.clear();
    core.clear();
    pill.clear();
    const at = cycle.active();
    const win = wins[at];
    if (!win || !geometry) {
      container.visible = false;
      return;
    }
    const { centers, cellSize, gap, callout } = geometry;
    const points = win.cells
      .map((c) => centers[c.reel]?.[c.row])
      .filter((p): p is { x: number; y: number } => p != null);

    // neon stack: wide soft glow, mid halo, thin bright core
    const unit = Math.max(2, cellSize / 14);
    strokePath(glow, points, unit * 3.2, 0.18, NEON);
    strokePath(halo, points, unit * 1.8, 0.45, NEON);
    strokePath(core, points, unit * 0.8, 1, NEON_CORE);

    // framed winning cells of the active line only
    const size = cellSize - gap;
    for (const c of win.cells) {
      const p = centers[c.reel]?.[c.row];
      if (!p) continue;
      frames
        .roundRect(p.x - size / 2, p.y - size / 2, size, size, 6)
        .stroke({ width: 3, color: NEON_CORE, alpha: 1 });
      frames
        .roundRect(p.x - size / 2 - 2, p.y - size / 2 - 2, size + 4, size + 4, 8)
        .stroke({ width: 3, color: NEON, alpha: 0.55 });
    }

    label.text = `LINE ${win.lineIndex + 1} PAYS ${formatCents(win.payoutCents)}`;
    label.position.set(callout.x, callout.y);
    const padX = 14;
    const padY = 6;
    pill
      .roundRect(
        callout.x - label.width / 2 - padX,
        callout.y - label.height / 2 - padY,
        label.width + padX * 2,
        label.height + padY * 2,
        8,
      )
      .fill({ color: 0x0b0b12, alpha: 0.82 })
      .stroke({ width: 2, color: NEON, alpha: 0.9 });
    container.visible = true;
  }

  return {
    container,

    showCycle(next: readonly LineWin[], nextGeometry: WinGeometry): void {
      if (destroyed) return;
      wins = next;
      geometry = nextGeometry;
      cycle.reset(next.length);
      pulse = 0;
      draw();
    },

    tick(deltaMS: number): void {
      if (destroyed || !container.visible) return;
      if (cycle.advance(deltaMS)) draw();
      // cheap breathing, one alpha write per frame
      if (Number.isFinite(deltaMS) && deltaMS > 0) pulse += deltaMS;
      container.alpha = 0.82 + 0.18 * Math.sin((pulse / PULSE_MS) * Math.PI * 2);
    },

    clear(): void {
      if (destroyed) return;
      wins = [];
      cycle.reset(0);
      container.alpha = 1;
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
