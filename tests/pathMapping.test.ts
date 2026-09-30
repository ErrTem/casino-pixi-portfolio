import { describe, expect, it } from "vitest";
import {
  gentleTiltRadians,
  pathProgress,
  pathTangentRadians,
  plotPoint,
  plotScaleFor,
  type PlotRect,
} from "../src/games/crash/view/pathMapping.js";
import { VIEW_CONFIG } from "../src/games/crash/view/viewConfig.js";

const plot: PlotRect = { x: 0, y: 0, width: 400, height: 300 };

describe("pathMapping — infinite diagonal sine + gentle tilt", () => {
  it("m=1 is the origin (left/bottom)", () => {
    const scale = plotScaleFor(1);
    const p = plotPoint(1, plot, scale);
    expect(p.x).toBe(plot.x);
    expect(p.y).toBe(plot.y + plot.height);
  });

  it("path undulates off the diagonal (sine, not a straight climb)", () => {
    const scale = plotScaleFor(4);
    let maxOff = 0;
    for (let i = 1; i <= 20; i++) {
      const m = 1 + ((4 - 1) * i) / 20;
      const p = plotPoint(m, plot, scale);
      const u = pathProgress(m);
      const diagX = plot.x + u * plot.width;
      const diagY = plot.y + plot.height - u * plot.height;
      maxOff = Math.max(maxOff, Math.hypot(p.x - diagX, p.y - diagY));
    }
    expect(maxOff).toBeGreaterThan(
      VIEW_CONFIG.PATH_SINE_AMPLITUDE * Math.min(plot.width, plot.height) * 0.5,
    );
    expect(VIEW_CONFIG.PATH_SINE_CYCLES).toBeGreaterThan(0);
  });

  it("first sine lobe arcs upward (Pixi Y decreases vs diagonal)", () => {
    const scale = plotScaleFor(4);
    // Small step off origin — phase π makes sin negative → opposite of down-right perp → up.
    const m = 1 + (VIEW_CONFIG.SCALE_FLOOR - 1) * 0.08;
    const p = plotPoint(m, plot, scale);
    const u = pathProgress(m);
    const diagY = plot.y + plot.height - u * plot.height;
    expect(p.y).toBeLessThan(diagY);
  });

  it("tip keeps advancing past SCALE_FLOOR, but slower than linear (log late)", () => {
    const scale = plotScaleFor(25);
    const floor = VIEW_CONFIG.SCALE_FLOOR;
    const pFloor = plotPoint(floor, plot, scale);
    const pLate = plotPoint(floor * 2, plot, scale);
    const traveled = Math.hypot(pLate.x - pFloor.x, pLate.y - pFloor.y);
    const diagLen = Math.hypot(plot.width, plot.height);
    // One doubling past floor adds PATH_LATE_SPAN diagonals — not a full extra span.
    expect(traveled).toBeGreaterThan(diagLen * VIEW_CONFIG.PATH_LATE_SPAN * 0.5);
    expect(traveled).toBeLessThan(diagLen * 0.75);
    expect(pathProgress(floor * 2)).toBeCloseTo(
      1 + VIEW_CONFIG.PATH_LATE_SPAN,
      6,
    );
    // High × must not race like the old linear (m-1)/(floor-1) mapping.
    expect(pathProgress(floor * 8)).toBeLessThan(1 + (floor * 8 - 1) / (floor - 1) * 0.25);
  });

  it("gentleTiltRadians clamps path tangent into a band", () => {
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
