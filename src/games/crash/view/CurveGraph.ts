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

function strokePath(
  g: Graphics,
  points: readonly PlotPoint[],
  width: number,
  color: number,
  alpha: number,
): void {
  if (points.length === 0) return;
  g.moveTo(points[0]!.x, points[0]!.y);
  for (let i = 1; i < points.length; i++) {
    g.lineTo(points[i]!.x, points[i]!.y);
  }
  g.stroke({ width, color, alpha, cap: "round", join: "round" });
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
  const out: PlotPoint[] = [{ x: points[0]!.x, y: points[0]!.y }];
  for (let i = 0; i < segs.length; i++) {
    const len = segs[i]!;
    if (acc + len >= target) {
      const t = (target - acc) / len;
      const a = points[i]!;
      const b = points[i + 1]!;
      out.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      });
      return out;
    }
    acc += len;
    out.push({ x: points[i + 1]!.x, y: points[i + 1]!.y });
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
  };
  const end = {
    x: start.x + ux * stubLen,
    y: start.y + uy * stubLen,
  };
  return [start, end];
}

export function createCurveGraph(): CurveGraph {
  const container = new Container();
  const halo = new Graphics();
  const core = new Graphics();
  container.addChild(halo, core);

  function redraw(
    points: readonly PlotPoint[],
    color: number,
    severed: boolean,
  ): void {
    halo.clear();
    core.clear();
    if (points.length < 2) return;

    const main = severed
      ? truncateToRatio(points, VIEW_CONFIG.SEVER_KEEP_RATIO)
      : points;

    strokePath(
      halo,
      main,
      VIEW_CONFIG.HALO_WIDTH,
      color,
      VIEW_CONFIG.HALO_ALPHA,
    );
    strokePath(core, main, VIEW_CONFIG.CORE_WIDTH, color, 1);

    if (severed) {
      const stub = severStub(points, VIEW_CONFIG.SEVER_KEEP_RATIO);
      if (stub) {
        strokePath(
          halo,
          stub,
          VIEW_CONFIG.HALO_WIDTH,
          color,
          VIEW_CONFIG.HALO_ALPHA,
        );
        strokePath(core, stub, VIEW_CONFIG.CORE_WIDTH, color, 1);
      }
    }
  }

  return { container, redraw };
}
