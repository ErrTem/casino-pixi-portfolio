import { Container, Graphics } from "pixi.js";
import type { PlotPoint } from "./pathMapping.js";
import { VIEW_CONFIG } from "./viewConfig.js";

export interface CurveGraph {
  container: Container;
  redraw: (
    points: readonly PlotPoint[],
    color: number,
    severed: boolean,
  ) => void;
}

function clamp01(t: number): number {
  if (!Number.isFinite(t)) return 0;
  return Math.min(1, Math.max(0, t));
}

/** Stroke a continuous subpath [i0..i1] as one polyline (no per-segment dots). */
function strokeContinuous(
  g: Graphics,
  points: readonly PlotPoint[],
  i0: number,
  i1: number,
  width: number,
  color: number,
  alpha: number,
): void {
  if (i1 - i0 < 1 || !(alpha > 0.004)) return;
  g.moveTo(points[i0]!.x, points[i0]!.y);
  for (let i = i0 + 1; i <= i1; i++) {
    g.lineTo(points[i]!.x, points[i]!.y);
  }
  g.stroke({
    width,
    color,
    alpha,
    cap: "round",
    join: "round",
  });
}

/**
 * Continuous layered fade along arc length: tip opaque, far tail gone.
 * Layers avoid per-segment round-cap "dots".
 */
function strokePathFaded(
  g: Graphics,
  points: readonly PlotPoint[],
  width: number,
  color: number,
  baseAlpha: number,
): void {
  if (points.length < 2 || !(baseAlpha > 0)) return;

  const cum: number[] = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i]!.x - points[i - 1]!.x;
    const dy = points[i]!.y - points[i - 1]!.y;
    total += Math.hypot(dx, dy);
    cum.push(total);
  }
  if (!(total > 0)) return;

  const visible = clamp01(VIEW_CONFIG.TRAIL_VISIBLE_FRACTION);
  const fadeStartDist = total * (1 - visible);

  // First vertex inside the visible window (nearest the tip).
  let start = 0;
  while (start < points.length - 1 && cum[start]! < fadeStartDist) {
    start++;
  }
  if (start > 0) start -= 1; // include one vertex before window for continuity
  if (start >= points.length - 1) return;

  const layers = Math.max(1, Math.floor(VIEW_CONFIG.TRAIL_FADE_LAYERS));
  const layerAlpha = baseAlpha / layers;
  const last = points.length - 1;
  const span = last - start;

  for (let L = 0; L < layers; L++) {
    const t = L / layers;
    const i0 = start + Math.floor(span * t);
    strokeContinuous(g, points, i0, last, width, color, layerAlpha);
  }
}

/** Full-opacity continuous stroke (crash stub). */
function strokePathSolid(
  g: Graphics,
  points: readonly PlotPoint[],
  width: number,
  color: number,
  baseAlpha: number,
): void {
  strokeContinuous(g, points, 0, points.length - 1, width, color, baseAlpha);
}

/** Truncate polyline so the last vertex sits at keepRatio of tip distance. */
function truncateToRatio(
  points: readonly PlotPoint[],
  keepRatio: number,
): PlotPoint[] {
  if (points.length < 2) return [...points];
  let total = 0;
  const segs: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i]!.x - points[i - 1]!.x;
    const dy = points[i]!.y - points[i - 1]!.y;
    const len = Math.hypot(dx, dy);
    segs.push(len);
    total += len;
  }
  if (total <= 0) return [...points];
  const target = total * keepRatio;
  let acc = 0;
  const out: PlotPoint[] = [
    { x: points[0]!.x, y: points[0]!.y, m: points[0]!.m },
  ];
  for (let i = 0; i < segs.length; i++) {
    const len = segs[i]!;
    if (acc + len >= target) {
      const t = (target - acc) / len;
      const a = points[i]!;
      const b = points[i + 1]!;
      out.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        m: a.m + (b.m - a.m) * t,
      });
      return out;
    }
    acc += len;
    out.push({
      x: points[i + 1]!.x,
      y: points[i + 1]!.y,
      m: points[i + 1]!.m,
    });
  }
  return out;
}

/** Short stub past a gap along the last segment toward the tip (D-09). */
function severStub(
  points: readonly PlotPoint[],
  keepRatio: number,
): PlotPoint[] | null {
  if (points.length < 2) return null;
  const tip = points[points.length - 1]!;
  const keepEnd = truncateToRatio(points, keepRatio);
  const breakPt = keepEnd[keepEnd.length - 1]!;
  const dx = tip.x - breakPt.x;
  const dy = tip.y - breakPt.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return null;
  const gap = Math.min(len * 0.35, 10);
  const stubLen = Math.min(len * 0.4, 14);
  const ux = dx / len;
  const uy = dy / len;
  const start = {
    x: breakPt.x + ux * gap,
    y: breakPt.y + uy * gap,
    m: tip.m,
  };
  const end = {
    x: start.x + ux * stubLen,
    y: start.y + uy * stubLen,
    m: tip.m,
  };
  return [start, end];
}

function strokeNeonStack(
  glow: Graphics,
  halo: Graphics,
  core: Graphics,
  points: readonly PlotPoint[],
  color: number,
  faded: boolean,
): void {
  const stroke = faded ? strokePathFaded : strokePathSolid;
  stroke(
    glow,
    points,
    VIEW_CONFIG.GLOW_OUTER_WIDTH,
    color,
    VIEW_CONFIG.GLOW_OUTER_ALPHA,
  );
  stroke(
    halo,
    points,
    VIEW_CONFIG.HALO_WIDTH,
    color,
    VIEW_CONFIG.HALO_ALPHA,
  );
  stroke(
    core,
    points,
    VIEW_CONFIG.CORE_WIDTH,
    color,
    VIEW_CONFIG.CORE_ALPHA,
  );
}

export function createCurveGraph(): CurveGraph {
  const container = new Container();
  const glow = new Graphics();
  const halo = new Graphics();
  const core = new Graphics();
  container.addChild(glow, halo, core);

  function redraw(
    points: readonly PlotPoint[],
    color: number,
    severed: boolean,
  ): void {
    glow.clear();
    halo.clear();
    core.clear();
    if (points.length < 2) return;

    const main = severed
      ? truncateToRatio(points, VIEW_CONFIG.SEVER_KEEP_RATIO)
      : points;

    strokeNeonStack(glow, halo, core, main, color, true);

    if (severed) {
      const stub = severStub(points, VIEW_CONFIG.SEVER_KEEP_RATIO);
      if (stub) {
        strokeNeonStack(glow, halo, core, stub, color, false);
      }
    }
  }

  return { container, redraw };
}
