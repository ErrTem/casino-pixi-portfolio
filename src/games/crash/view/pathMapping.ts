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
  /** Multiplier this point was sampled at (for trail fade). */
  m: number;
}

/** Kept for callers; path no longer remaps into a growing axis (avoids tip freeze). */
export function plotScaleFor(multiplier: number): PlotScale {
  const m = Number.isFinite(multiplier) ? Math.max(1, multiplier) : 1;
  const extent = Math.max(
    VIEW_CONFIG.SCALE_FLOOR,
    m * VIEW_CONFIG.SCALE_HEADROOM,
  );
  return { xMax: extent, yMax: extent };
}

/**
 * Progress along the infinite diagonal: 0 at m=1, 1 when m == SCALE_FLOOR.
 * Past SCALE_FLOOR, advances with log2(m) so high × stays readable (not a rocket).
 */
export function pathProgress(multiplier: number): number {
  if (!Number.isFinite(multiplier)) return 0;
  const m = Math.max(1, multiplier);
  const floor = Math.max(1 + 1e-6, VIEW_CONFIG.SCALE_FLOOR);
  if (m <= floor) {
    return (m - 1) / (floor - 1);
  }
  return 1 + Math.log2(m / floor) * VIEW_CONFIG.PATH_LATE_SPAN;
}

/** Inverse of pathProgress — sample evenly along the diagonal. */
export function multiplierAtProgress(u: number): number {
  if (!Number.isFinite(u) || u <= 0) return 1;
  const floor = Math.max(1 + 1e-6, VIEW_CONFIG.SCALE_FLOOR);
  if (u <= 1) {
    return 1 + u * (floor - 1);
  }
  const span = Math.max(1e-6, VIEW_CONFIG.PATH_LATE_SPAN);
  return floor * 2 ** ((u - 1) / span);
}

/**
 * Map multiplier into plot/world pixels along an infinite diagonal sine wave.
 * m=1 is origin (left/bottom). Camera follows the tip so late climb keeps moving.
 */
export function plotPoint(
  multiplier: number,
  plot: PlotRect,
  _scale?: PlotScale,
): PlotPoint {
  void _scale;
  const m = Number.isFinite(multiplier) ? Math.max(1, multiplier) : 1;
  if (!Number.isFinite(multiplier)) {
    return { x: plot.x, y: plot.y + plot.height, m: 1 };
  }

  const diagLen = Math.hypot(plot.width, plot.height);
  const originX = plot.x;
  const originY = plot.y + plot.height;
  if (!(diagLen > 0)) {
    return { x: originX, y: originY, m };
  }

  const u = pathProgress(m);
  // Unit along diagonal (up-right in Pixi Y-down) and its perpendicular.
  const ax = plot.width / diagLen;
  const ay = -plot.height / diagLen;
  const px = plot.height / diagLen;
  const py = plot.width / diagLen;

  const along = u * diagLen;
  const amp =
    VIEW_CONFIG.PATH_SINE_AMPLITUDE * Math.min(plot.width, plot.height);
  // Phase keyed to unbounded progress — keeps oscillating past SCALE_FLOOR.
  // u==0 → exact origin (sin(π) is not a clean 0 in float).
  const wave =
    u <= 0
      ? 0
      : Math.sin(
          u * VIEW_CONFIG.PATH_SINE_CYCLES * Math.PI * 2 +
            VIEW_CONFIG.PATH_SINE_PHASE,
        ) * amp;

  return {
    x: originX + along * ax + wave * px,
    y: originY + along * ay + wave * py,
    m,
  };
}

/** Tangent (radians) along the climb; nose points +X before rotation. */
export function pathTangentRadians(
  multiplier: number,
  plot: PlotRect,
  scale?: PlotScale,
): number {
  if (!Number.isFinite(multiplier)) return 0;
  const a = plotPoint(multiplier, plot, scale);
  const b = plotPoint(multiplier + 0.02, plot, scale);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return 0;
  return Math.atan2(dy, dx);
}

/** Clamp path tangent into a tilt band (D-18). */
export function gentleTiltRadians(tangent: number): number {
  if (!Number.isFinite(tangent)) return 0;
  const max = VIEW_CONFIG.TILT_MAX_RAD;
  return Math.max(-max, Math.min(max, tangent));
}
