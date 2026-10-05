import { describe, expect, it } from "vitest";
import { CRASH_CONFIG } from "../logic/config.js";
import { PRESET_CHIPS, clampStake, maxAffordableStake } from "./chips.js";

const DISPLAY_MIN = CRASH_CONFIG.minBetCents / 100;
const DISPLAY_MAX = CRASH_CONFIG.maxBetCents / 100;

describe("PRESET_CHIPS (quick-add)", () => {
  it("equals 1 / 5 / 10 / 20 / 50", () => {
    expect([...PRESET_CHIPS]).toEqual([1, 5, 10, 20, 50]);
  });

  it("every chip is a positive integer", () => {
    for (const value of PRESET_CHIPS) {
      expect(value).toBeGreaterThan(0);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

describe("clampStake", () => {
  it("clamps to min/max inclusive", () => {
    expect(clampStake(1)).toBe(DISPLAY_MIN);
    expect(clampStake(DISPLAY_MAX + 50)).toBe(DISPLAY_MAX);
    expect(clampStake(100)).toBe(100);
  });
});

describe("maxAffordableStake", () => {
  it("floors balance and clamps to DISPLAY_MAX", () => {
    expect(maxAffordableStake(250.7)).toBe(250);
    expect(maxAffordableStake(5000)).toBe(DISPLAY_MAX);
    expect(maxAffordableStake(DISPLAY_MAX + 50)).toBe(DISPLAY_MAX);
  });

  it("returns below DISPLAY_MIN when broke", () => {
    expect(maxAffordableStake(DISPLAY_MIN - 1)).toBeLessThan(DISPLAY_MIN);
    expect(maxAffordableStake(5)).toBe(5);
    expect(maxAffordableStake(0)).toBe(0);
  });

  it("never exceeds DISPLAY_MAX", () => {
    expect(maxAffordableStake(Number.POSITIVE_INFINITY)).toBe(DISPLAY_MAX);
    expect(maxAffordableStake(1e9)).toBe(DISPLAY_MAX);
  });
});
