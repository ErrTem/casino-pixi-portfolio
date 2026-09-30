import { Container, Graphics } from "pixi.js";
import { VIEW_CONFIG } from "./viewConfig.js";

export interface Backdrop {
  container: Container;
  /** Rebuild layers only when screen size changes — never clear every sync frame. */
  rebuildIfNeeded: (width: number, height: number) => void;
  /**
   * Advance parallax + speed lines.
   * @param intensity 0..1 climb spectacle (0 idle/waiting/crash).
   */
  tick: (deltaMS: number, intensity?: number) => void;
}

function clamp01(t: number): number {
  if (!Number.isFinite(t)) return 0;
  return Math.min(1, Math.max(0, t));
}

function fillStarDust(
  g: Graphics,
  count: number,
  w: number,
  h: number,
  yBand: { top: number; span: number },
  seed: number,
  dustish: boolean,
): void {
  for (let i = 0; i < count; i++) {
    const u = ((i * 47 + seed * 13) % 97) / 97;
    const v = ((i * 31 + seed * 17 + 13) % 89) / 89;
    const x = u * w * 2;
    const y = h * (yBand.top + v * yBand.span);
    if (dustish && i % 4 === 0) {
      const rx = 1.2 + (i % 3) * 0.8;
      const ry = 0.5 + (i % 2) * 0.35;
      g.ellipse(x, y, rx, ry).fill({
        color: 0xc8c4ff,
        alpha: 0.1 + (i % 5) * 0.03,
      });
    } else {
      const r = 0.55 + (i % 3) * 0.35;
      g.circle(x, y, r).fill({
        color: 0xffffff,
        alpha: 0.16 + (i % 5) * 0.05,
      });
    }
  }
}

/**
 * Flat night field, 3 parallax star/dust layers, clouds, multiplier-driven speed lines.
 */
export function createBackdrop(width: number, height: number): Backdrop {
  const container = new Container();
  let lastW = -1;
  let lastH = -1;
  let scrollMs = 0;
  let farLayer: Graphics | null = null;
  let midLayer: Graphics | null = null;
  let nearLayer: Graphics | null = null;
  let clouds: Graphics | null = null;
  let speedLines: Graphics | null = null;
  let screenW = width;
  let screenH = height;
  let lastIntensity = 0;

  function rebuild(w: number, h: number): void {
    container.removeChildren();
    screenW = w;
    screenH = h;

    const sky = new Graphics();
    sky.rect(0, 0, w, h).fill({ color: VIEW_CONFIG.BACKGROUND });
    container.addChild(sky);

    farLayer = new Graphics();
    fillStarDust(farLayer, 40, w, h, { top: 0.02, span: 0.5 }, 1, false);
    container.addChild(farLayer);

    midLayer = new Graphics();
    fillStarDust(midLayer, 48, w, h, { top: 0.04, span: 0.48 }, 2, true);
    container.addChild(midLayer);

    nearLayer = new Graphics();
    fillStarDust(nearLayer, 36, w, h, { top: 0.06, span: 0.44 }, 3, true);
    container.addChild(nearLayer);

    clouds = new Graphics();
    const cloudSpecs = [
      { cx: w * 0.18, cy: h * 0.78, rx: w * 0.12, ry: h * 0.035 },
      { cx: w * 0.48, cy: h * 0.82, rx: w * 0.16, ry: h * 0.04 },
      { cx: w * 0.78, cy: h * 0.76, rx: w * 0.11, ry: h * 0.03 },
      { cx: w * 0.35, cy: h * 0.88, rx: w * 0.09, ry: h * 0.025 },
      { cx: w * 0.62, cy: h * 0.86, rx: w * 0.13, ry: h * 0.032 },
      { cx: w * 1.18, cy: h * 0.8, rx: w * 0.12, ry: h * 0.035 },
      { cx: w * 1.48, cy: h * 0.84, rx: w * 0.14, ry: h * 0.038 },
      { cx: w * 1.78, cy: h * 0.77, rx: w * 0.1, ry: h * 0.028 },
    ];
    for (const c of cloudSpecs) {
      clouds.ellipse(c.cx, c.cy, c.rx, c.ry).fill({
        color: 0x3a386a,
        alpha: 0.28,
      });
    }
    container.addChild(clouds);

    speedLines = new Graphics();
    container.addChild(speedLines);

    lastW = w;
    lastH = h;
  }

  function redrawSpeedLines(intensity: number): void {
    if (!speedLines) return;
    speedLines.clear();
    const i = clamp01(intensity);
    if (i < 0.02) return;

    const n = VIEW_CONFIG.SPEED_LINE_COUNT;
    const alphaMax = VIEW_CONFIG.SPEED_LINE_ALPHA_MAX * i;
    const w = screenW;
    const h = screenH;
    const lenBase = 28 + i * 52;

    for (let k = 0; k < n; k++) {
      // Deterministic pseudo-scatter + intensity-driven density (draw fewer when low i).
      if (k / n > i * 0.85 + 0.15) continue;
      const u = ((k * 53 + 7) % 97) / 97;
      const v = ((k * 29 + 19) % 89) / 89;
      const x1 = u * w;
      const y1 = h * (0.08 + v * 0.55);
      const len = lenBase * (0.55 + (k % 5) * 0.12);
      // Slight diagonal (speed-line feel), mostly horizontal leftward.
      const x0 = x1 - len;
      const y0 = y1 + len * 0.08;
      speedLines.moveTo(x0, y0).lineTo(x1, y1);
      speedLines.stroke({
        width: 1.2 + (k % 3) * 0.4,
        color: 0xffffff,
        alpha: alphaMax * (0.35 + (k % 4) * 0.15),
        cap: "round",
      });
    }
  }

  function layerOffset(
    periodMs: number,
    intensity: number,
    bobPeriod: number,
    bobAmp: number,
  ): { x: number; y: number } {
    const boost = 1 + (VIEW_CONFIG.PARALLAX_SPEED_BOOST - 1) * clamp01(intensity);
    const period = Math.max(1_000, periodMs / boost);
    const w = screenW > 0 ? screenW : 1;
    const u = (scrollMs % period) / period;
    return {
      x: -u * w,
      y: Math.sin((scrollMs * 2 * Math.PI) / bobPeriod) * bobAmp,
    };
  }

  rebuild(width, height);

  return {
    container,
    rebuildIfNeeded(nextW: number, nextH: number): void {
      if (nextW !== lastW || nextH !== lastH) {
        rebuild(nextW, nextH);
      }
    },
    tick(deltaMS: number, intensity = 0): void {
      const dt = Number.isFinite(deltaMS) ? Math.max(0, deltaMS) : 0;
      const i = clamp01(intensity);
      scrollMs += dt;

      if (farLayer) {
        const o = layerOffset(
          VIEW_CONFIG.PARALLAX_FAR_PERIOD_MS,
          i,
          28_000,
          3,
        );
        farLayer.position.set(o.x, o.y);
      }
      if (midLayer) {
        const o = layerOffset(
          VIEW_CONFIG.PARALLAX_MID_PERIOD_MS,
          i,
          18_000,
          4,
        );
        midLayer.position.set(o.x, o.y);
      }
      if (nearLayer) {
        const o = layerOffset(
          VIEW_CONFIG.PARALLAX_NEAR_PERIOD_MS,
          i,
          12_000,
          5,
        );
        nearLayer.position.set(o.x, o.y);
      }
      if (clouds) {
        const boost = 1 + (VIEW_CONFIG.PARALLAX_SPEED_BOOST - 1) * i;
        const cloudPeriod = Math.max(4_000, 28_000 / boost);
        const w = screenW > 0 ? screenW : 1;
        const cloudU = (scrollMs % cloudPeriod) / cloudPeriod;
        clouds.position.x = -cloudU * w;
        clouds.position.y = Math.sin((scrollMs * 2 * Math.PI) / 9_000) * 5;
      }

      // Redraw speed lines when intensity changes meaningfully (avoid clear every frame).
      if (Math.abs(i - lastIntensity) > 0.02 || (i > 0.02 && lastIntensity <= 0.02)) {
        redrawSpeedLines(i);
        lastIntensity = i;
      } else if (i < 0.02 && lastIntensity >= 0.02) {
        redrawSpeedLines(0);
        lastIntensity = 0;
      }
    },
  };
}
