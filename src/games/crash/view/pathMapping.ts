import { VIEW_CONFIG } from "./viewConfig.js";

export interface PlotRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlotScale {
  xMax: number;
  yMax: number;
}

export interface PlotPoint {
  x: number;
  y: number;
}

/** Axis maxima grow with the live multiplier so the tip stays on screen. */
export function plotScaleFor(multiplier: number): PlotScale {
  const m = Number.isFinite(multiplier) ? Math.max(1, multiplier) : 1;
  const extent = Math.max(
    VIEW_CONFIG.SCALE_FLOOR,
    m * VIEW_CONFIG.SCALE_HEADROOM,
  );
  return { xMax: extent, yMax: extent };
}

/**
 * Map multiplier into plot pixels. m=1 is origin (left/bottom).
 * Soft arcade X (D-16): blend log2-X with linear X so mid/late climb
 * does not vertical-spike as hard under a centered craft camera.
 * Y stays linear (m-1)/(yMax-1) with Pixi Y down.
 */
export function plotPoint(
  multiplier: number,
  plot: PlotRect,
  scale: PlotScale,
): PlotPoint {
  if (!Number.isFinite(multiplier)) {
    return { x: plot.x, y: plot.y + plot.height };
  }
  const m = Math.max(1, multiplier);
  const { xMax, yMax } = scale;
  const logDenom = Math.log2(xMax);
  const uLog = logDenom > 0 ? Math.log2(m) / logDenom : 0;
  const linDenom = xMax - 1;
  const uLin = linDenom > 0 ? (m - 1) / linDenom : 0;
  const blend = Math.min(1, Math.max(0, VIEW_CONFIG.PLOT_X_LINEAR_BLEND));
  const u = uLog * (1 - blend) + uLin * blend;
  const vDenom = yMax - 1;
  const v = vDenom > 0 ? (m - 1) / vDenom : 0;
  return {
    x: plot.x + u * plot.width,
    y: plot.y + plot.height - v * plot.height,
  };
}

/** Tangent (radians) along the climb; nose points +X before rotation. */
export function pathTangentRadians(
  multiplier: number,
  plot: PlotRect,
  scale: PlotScale,
): number {
  if (!Number.isFinite(multiplier)) return 0;
  const a = plotPoint(multiplier, plot, scale);
  const b = plotPoint(multiplier + 0.02, plot, scale);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return 0;
  return Math.atan2(dy, dx);
}

/** Clamp path tangent into a gentle tilt band (D-18, ±TILT_MAX_RAD). */
export function gentleTiltRadians(tangent: number): number {
  if (!Number.isFinite(tangent)) return 0;
  const max = VIEW_CONFIG.TILT_MAX_RAD;
  return Math.max(-max, Math.min(max, tangent));
}
