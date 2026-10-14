import { describe, expect, it } from "vitest";
import {
  LAND_MS,
  SPIN_CELLS_PER_MS,
  SPIN_MIN_MS,
  STAGGER_MS,
  TURBO_SPIN_MIN_MS,
  TURBO_STAGGER_MS,
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

  it("keeps today's numbers when turbo is off or missing", () => {
    for (let reel = 0; reel < 5; reel += 1) {
      expect(staggerDelayMs(reel, false)).toBe(staggerDelayMs(reel));
      expect(staggerDelayMs(reel)).toBe(SPIN_MIN_MS + reel * STAGGER_MS);
    }
  });

  it("turbo lands every reel sooner and still left to right", () => {
    for (let reel = 0; reel < 5; reel += 1) {
      expect(staggerDelayMs(reel, true)).toBeLessThan(staggerDelayMs(reel, false));
      if (reel > 0) {
        expect(staggerDelayMs(reel, true)).toBeGreaterThan(
          staggerDelayMs(reel - 1, true),
        );
      }
    }
    expect(staggerDelayMs(0, true)).toBe(TURBO_SPIN_MIN_MS);
    expect(staggerDelayMs(1, true) - staggerDelayMs(0, true)).toBe(
      TURBO_STAGGER_MS,
    );
  });

  it("turbo last reel is at most half of the normal time", () => {
    expect(staggerDelayMs(4, true)).toBeLessThanOrEqual(
      staggerDelayMs(4, false) / 2,
    );
  });

  it("turbo clamps bad indexes too", () => {
    expect(staggerDelayMs(-1, true)).toBe(staggerDelayMs(0, true));
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
