import { describe, expect, it } from "vitest";
import {
  LAND_MS,
  SPIN_CELLS_PER_MS,
  landOffset,
  smoothstep,
  staggerDelayMs,
} from "./reelMotion.js";

describe("staggerDelayMs", () => {
  it("grows left to right with a readable gap", () => {
    for (let reel = 1; reel < 5; reel += 1) {
      const gap = staggerDelayMs(reel) - staggerDelayMs(reel - 1);
      expect(gap).toBeGreaterThanOrEqual(150);
    }
  });

  it("clamps bad indexes to the first reel", () => {
    expect(staggerDelayMs(-3)).toBe(staggerDelayMs(0));
    expect(staggerDelayMs(Number.NaN)).toBe(staggerDelayMs(0));
  });
});

describe("smoothstep", () => {
  it("hits the edges and the middle", () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 2)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 6);
  });
});

describe("landOffset", () => {
  const start = -4.4;
  const v0 = SPIN_CELLS_PER_MS * LAND_MS;

  it("starts at the spin offset and ends exactly on the grid", () => {
    expect(landOffset(start, v0, 0)).toBeCloseTo(start, 9);
    expect(landOffset(start, v0, 1)).toBe(0);
    expect(landOffset(start, v0, 5)).toBe(0);
  });

  it("only moves forward and never overshoots the grid", () => {
    let prev = landOffset(start, v0, 0);
    for (let i = 1; i <= 100; i += 1) {
      const y = landOffset(start, v0, i / 100);
      expect(y).toBeGreaterThanOrEqual(prev - 1e-9);
      expect(y).toBeLessThanOrEqual(1e-9);
      prev = y;
    }
  });

  it("matches the spin speed at the start so the stop does not hitch", () => {
    const dt = 1e-4;
    const slope = (landOffset(start, v0, dt) - landOffset(start, v0, 0)) / dt;
    expect(slope / LAND_MS).toBeCloseTo(SPIN_CELLS_PER_MS, 3);
  });
});
