import { describe, expect, it } from "vitest";
import {
  fromMultHundredths,
  toMultHundredths,
} from "../src/shared/money/cents.js";
import { CRASH_CONFIG } from "../src/games/crash/logic/config.js";
import { multiplierAt } from "../src/games/crash/logic/MultiplierCurve.js";

describe("multiplierCurve — PLAY-02 / D-09..D-12 / FEEL-01", () => {
  const r = CRASH_CONFIG.growthRatePerMs;

  it("equals 1.00 at 0ms and 2.00 near 3750ms (D-14 / FEEL-01)", () => {
    expect(multiplierAt(0, r)).toBe(1.0);
    expect(multiplierAt(3750, Math.LN2 / 3750)).toBe(2.0);
    expect(r).toBe(Math.LN2 / 3750);
  });

  it("rises monotonically with elapsedMs", () => {
    const samples = [0, 100, 500, 1000, 3750, 5000].map((t) =>
      multiplierAt(t, r),
    );
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThan(samples[i - 1]!);
    }
  });

  it("uses smooth exponential e^(r·t), not linear (D-10)", () => {
    const t = 1875;
    const expected = fromMultHundredths(
      toMultHundredths(Math.exp(r * t)),
    );
    const linear = fromMultHundredths(
      toMultHundredths(1 + (2 - 1) * (t / 3750)),
    );
    const actual = multiplierAt(t, r);
    expect(actual).toBe(expected);
    expect(actual).not.toBe(linear);
  });

  it("rounds via hundredths path (D-11)", () => {
    const raw = Math.exp(r * 100);
    const rounded = fromMultHundredths(toMultHundredths(raw));
    expect(multiplierAt(100, r)).toBe(rounded);
    expect(Number.isInteger(toMultHundredths(multiplierAt(100, r)))).toBe(
      true,
    );
  });

  it("growthRatePerMs is the named CRASH_CONFIG constant (D-12 / D-14)", () => {
    expect(CRASH_CONFIG).toHaveProperty("growthRatePerMs");
    expect(typeof CRASH_CONFIG.growthRatePerMs).toBe("number");
    expect(multiplierAt(3750)).toBe(2.0);
  });
});
