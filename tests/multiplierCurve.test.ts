import { describe, expect, it } from "vitest";
import {
  fromMultHundredths,
  toMultHundredths,
} from "../src/shared/money/cents.js";
import { CRASH_CONFIG } from "../src/games/crash/logic/config.js";
import { multiplierAt } from "../src/games/crash/logic/MultiplierCurve.js";

describe("multiplierCurve - PLAY-02 / climb pace", () => {
  const r = CRASH_CONFIG.growthRatePerMs;
  const twoXMs = Math.LN2 / r;

  it("equals 1.00 at 0ms and 2.00 at configured doubling time", () => {
    expect(multiplierAt(0, r)).toBe(1.0);
    expect(multiplierAt(twoXMs, Math.LN2 / twoXMs)).toBe(2.0);
    expect(r).toBe(Math.LN2 / twoXMs);
  });

  it("rises monotonically with elapsedMs", () => {
    const samples = [0, 100, 500, 1000, twoXMs, 10_000].map((t) =>
      multiplierAt(t, r),
    );
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThan(samples[i - 1]!);
    }
  });

  it("uses smooth exponential e^(r·t), not linear", () => {
    const t = twoXMs / 2;
    const expected = fromMultHundredths(
      toMultHundredths(Math.exp(r * t)),
    );
    const linear = fromMultHundredths(
      toMultHundredths(1 + (2 - 1) * (t / twoXMs)),
    );
    const actual = multiplierAt(t, r);
    expect(actual).toBe(expected);
    expect(actual).not.toBe(linear);
  });

  it("rounds via hundredths path", () => {
    const raw = Math.exp(r * 100);
    const rounded = fromMultHundredths(toMultHundredths(raw));
    expect(multiplierAt(100, r)).toBe(rounded);
    expect(Number.isInteger(toMultHundredths(multiplierAt(100, r)))).toBe(
      true,
    );
  });

  it("growthRatePerMs is the named CRASH_CONFIG constant", () => {
    expect(CRASH_CONFIG).toHaveProperty("growthRatePerMs");
    expect(typeof CRASH_CONFIG.growthRatePerMs).toBe("number");
    expect(multiplierAt(twoXMs)).toBe(2.0);
  });
});
