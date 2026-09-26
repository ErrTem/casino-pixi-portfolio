import { Container, FillGradient, Graphics } from "pixi.js";
import { VIEW_CONFIG } from "./viewConfig.js";

export interface Backdrop {
  container: Container;
  /** Rebuild layers only when screen size changes — never clear every sync frame. */
  rebuildIfNeeded: (width: number, height: number) => void;
}

/**
 * Sky → clouds → cosmos gradient with stars, soft clouds, and a dim plot grid (D-04).
 * Static after resize; no parallax.
 */
export function createBackdrop(width: number, height: number): Backdrop {
  const container = new Container();
  let lastW = -1;
  let lastH = -1;

  function rebuild(w: number, h: number): void {
    container.removeChildren();

    const sky = new Graphics();
    const gradient = new FillGradient({
      type: "linear",
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: "#7ec8ff" },
        { offset: 0.42, color: "#c5d4e8" },
        { offset: 1, color: "#070b18" },
      ],
    });
    sky.rect(0, 0, w, h).fill(gradient);
    container.addChild(sky);

    const clouds = new Graphics();
    const cloudSpecs = [
      { cx: w * 0.18, cy: h * 0.22, rx: w * 0.12, ry: h * 0.035 },
      { cx: w * 0.48, cy: h * 0.28, rx: w * 0.16, ry: h * 0.04 },
      { cx: w * 0.78, cy: h * 0.2, rx: w * 0.11, ry: h * 0.03 },
      { cx: w * 0.35, cy: h * 0.34, rx: w * 0.09, ry: h * 0.025 },
      { cx: w * 0.62, cy: h * 0.36, rx: w * 0.13, ry: h * 0.032 },
    ];
    for (const c of cloudSpecs) {
      clouds.ellipse(c.cx, c.cy, c.rx, c.ry).fill({
        color: 0xffffff,
        alpha: 0.14,
      });
    }
    container.addChild(clouds);

    const stars = new Graphics();
    // Deterministic ~40 stars from a fixed seed pattern (no Math.random per rebuild).
    for (let i = 0; i < 40; i++) {
      const u = ((i * 47) % 97) / 97;
      const v = ((i * 31 + 13) % 89) / 89;
      const x = u * w;
      const y = h * (0.35 + v * 0.62);
      const r = 0.6 + (i % 3) * 0.35;
      stars.circle(x, y, r).fill({
        color: 0xffffff,
        alpha: 0.18 + (i % 5) * 0.04,
      });
    }
    container.addChild(stars);

    const plotTop = VIEW_CONFIG.PLOT_TOP_RATIO * h;
    const plotX = 24;
    const plotY = plotTop;
    const plotW = Math.max(1, w - 48);
    const plotH = Math.max(1, h - plotTop - 24);
    const grid = new Graphics();
    const cols = 8;
    const rows = 6;
    for (let c = 0; c <= cols; c++) {
      const x = plotX + (c / cols) * plotW;
      grid.moveTo(x, plotY).lineTo(x, plotY + plotH);
    }
    for (let r = 0; r <= rows; r++) {
      const y = plotY + (r / rows) * plotH;
      grid.moveTo(plotX, y).lineTo(plotX + plotW, y);
    }
    grid.stroke({ width: 1, color: 0xffffff, alpha: 0.06 });
    container.addChild(grid);

    lastW = w;
    lastH = h;
  }

  rebuild(width, height);

  return {
    container,
    rebuildIfNeeded(nextW: number, nextH: number): void {
      if (nextW !== lastW || nextH !== lastH) {
        rebuild(nextW, nextH);
      }
    },
  };
}
