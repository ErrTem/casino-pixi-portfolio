import { describe, expect, it } from "vitest";
import {
  pathTangentRadians,
  plotPoint,
  plotScaleFor,
  type PlotRect,
} from "../src/games/crash/view/pathMapping.js";

const plot: PlotRect = { x: 0, y: 0, width: 400, height: 300 };

describe("pathMapping — D-03 plot shape", () => {
  it("m=1 is the origin (left/bottom)", () => {
    const scale = plotScaleFor(1);
    const p = plotPoint(1, plot, scale);
    expect(p.x).toBe(plot.x);
    expect(p.y).toBe(plot.y + plot.height);
  });

  it("absolute pixel slope from 2× to 4× is steeper than from 1× to 2× (D-03)", () => {
    const scale = plotScaleFor(4);
    const p1 = plotPoint(1, plot, scale);
    const p2 = plotPoint(2, plot, scale);
    const p4 = plotPoint(4, plot, scale);
    const slope12 = Math.abs((p2.y - p1.y) / (p2.x - p1.x));
    const slope24 = Math.abs((p4.y - p2.y) / (p4.x - p2.x));
    expect(slope24).toBeGreaterThan(slope12);
  });

  it("non-finite multiplier yields finite x/y with no NaN", () => {
    const scale = plotScaleFor(Number.NaN);
    const p = plotPoint(Number.NaN, plot, scale);
    expect(Number.isFinite(p.x)).toBe(true);
    expect(Number.isFinite(p.y)).toBe(true);
    expect(Number.isNaN(p.x)).toBe(false);
    expect(Number.isNaN(p.y)).toBe(false);
    const tan = pathTangentRadians(Number.NaN, plot, scale);
    expect(tan).toBe(0);
    expect(Number.isFinite(tan)).toBe(true);
  });
});
