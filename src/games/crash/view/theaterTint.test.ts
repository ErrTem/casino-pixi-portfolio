import { describe, expect, it } from "vitest";
import { theaterTintForMult } from "./TheaterText.js";
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

  it("is monotonic-ish in red channel from 10→fireAt", () => {
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
