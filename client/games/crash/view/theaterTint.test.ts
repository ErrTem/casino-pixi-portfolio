import { describe, expect, it } from "vitest";
import { liveScaleProgress, theaterTintForMult } from "./TheaterText.js";
import { VIEW_CONFIG } from "./viewConfig.js";

describe("theaterTintForMult", () => {
  it("returns near-white for non-finite", () => {
    expect(theaterTintForMult(Number.NaN)).toBe(VIEW_CONFIG.TINT_NEAR_WHITE);
    expect(theaterTintForMult(Number.POSITIVE_INFINITY)).toBe(
      VIEW_CONFIG.TINT_NEAR_WHITE,
    );
  });

  it("stays near-white through 10× inclusive", () => {
    expect(theaterTintForMult(1)).toBe(VIEW_CONFIG.TINT_NEAR_WHITE);
    expect(theaterTintForMult(5)).toBe(VIEW_CONFIG.TINT_NEAR_WHITE);
    expect(theaterTintForMult(10)).toBe(VIEW_CONFIG.TINT_NEAR_WHITE);
  });

  it("shifts toward gold shortly after 10×", () => {
    const t = theaterTintForMult(12);
    expect(t).not.toBe(VIEW_CONFIG.TINT_NEAR_WHITE);
    const r = (t >> 16) & 0xff;
    const g = (t >> 8) & 0xff;
    const b = t & 0xff;
    // Warm: red high, blue lower than white
    expect(r).toBeGreaterThanOrEqual(0xf0);
    expect(b).toBeLessThan(0xf0);
    expect(g).toBeGreaterThan(0xa0);
  });

  it("approaches fire band at high multipliers", () => {
    const t = theaterTintForMult(VIEW_CONFIG.TINT_FIRE_AT_M);
    expect(t).toBe(VIEW_CONFIG.TINT_FIRE);
  });

  it("is monotonic-ish in red channel from 10->fireAt", () => {
    const a = theaterTintForMult(11);
    const b = theaterTintForMult(18);
    const c = theaterTintForMult(VIEW_CONFIG.TINT_FIRE_AT_M);
    const red = (n: number) => (n >> 16) & 0xff;
    // All warm; fire end keeps high red
    expect(red(a)).toBeGreaterThanOrEqual(0xe0);
    expect(red(b)).toBeGreaterThanOrEqual(0xe0);
    expect(red(c)).toBe(0xff);
  });
});

describe("liveScaleProgress", () => {
  it("is 0 at/below LIVE_SCALE_START_M and saturates at LIVE_SCALE_AT_M", () => {
    expect(liveScaleProgress(1)).toBe(0);
    expect(liveScaleProgress(VIEW_CONFIG.LIVE_SCALE_START_M)).toBe(0);
    expect(liveScaleProgress(VIEW_CONFIG.LIVE_SCALE_AT_M)).toBe(1);
    expect(liveScaleProgress(VIEW_CONFIG.LIVE_SCALE_AT_M * 2)).toBe(1);
  });

  it("grows monotonically between START and AT", () => {
    const a = liveScaleProgress(4);
    const b = liveScaleProgress(8);
    const c = liveScaleProgress(20);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    expect(c).toBeLessThanOrEqual(1);
  });
});
