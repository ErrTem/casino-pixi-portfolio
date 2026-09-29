import { describe, expect, it } from "vitest";
import {
  gentleTiltRadians,
  pathTangentRadians,
  plotPoint,
  plotScaleFor,
  type PlotRect,
} from "../src/games/crash/view/pathMapping.js";
import { VIEW_CONFIG } from "../src/games/crash/view/viewConfig.js";

const plot: PlotRect = { x: 0, y: 0, width: 400, height: 300 };

describe("pathMapping — D-16 soft plot + D-18 gentle tilt", () => {
  it("m=1 is the origin (left/bottom)", () => {
    const scale = plotScaleFor(1);
    const p = plotPoint(1, plot, scale);
    expect(p.x).toBe(plot.x);
    expect(p.y).toBe(plot.y + plot.height);
  });

  it("mid/late climb tip motion is soft — 2×→4× slope not dramatically steeper than 1×→2× (D-16)", () => {
    const scale = plotScaleFor(4);
    const p1 = plotPoint(1, plot, scale);
    const p2 = plotPoint(2, plot, scale);
    const p4 = plotPoint(4, plot, scale);
    const slope12 = Math.abs((p2.y - p1.y) / (p2.x - p1.x));
    const slope24 = Math.abs((p4.y - p2.y) / (p4.x - p2.x));
    // Soft mapping (linear X blend + milder headroom) keeps late climb readable under arcade camera.
    expect(slope24 / slope12).toBeLessThanOrEqual(1.45);
    expect(VIEW_CONFIG.PLOT_X_LINEAR_BLEND).toBeGreaterThan(0);
    expect(VIEW_CONFIG.SCALE_HEADROOM).toBeLessThanOrEqual(1.2);
  });

  it("gentleTiltRadians clamps path tangent into a small band (D-18)", () => {
    const max = VIEW_CONFIG.TILT_MAX_RAD;
    expect(max).toBeGreaterThan(0);
    expect(gentleTiltRadians(0)).toBe(0);
    expect(gentleTiltRadians(max)).toBeCloseTo(max, 6);
    expect(gentleTiltRadians(-max)).toBeCloseTo(-max, 6);
    expect(gentleTiltRadians(Math.PI / 2)).toBeCloseTo(max, 6);
    expect(gentleTiltRadians(-Math.PI / 2)).toBeCloseTo(-max, 6);
    expect(Math.abs(gentleTiltRadians(1.2))).toBeLessThanOrEqual(max + 1e-9);
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
    expect(gentleTiltRadians(Number.NaN)).toBe(0);
  });
});
