import { describe, expect, it } from "vitest";
import { CRASH_CONFIG } from "../logic/config.js";
import { ALL_CHIP, PRESET_CHIPS, maxAffordableStake } from "./chips.js";

/** Display-unit bet bounds (D-02 / WALT-03Δ). */
const DISPLAY_MIN = CRASH_CONFIG.minBetCents / 100;
const DISPLAY_MAX = CRASH_CONFIG.maxBetCents / 100;

describe("PRESET_CHIPS (WALT-03Δ)", () => {
  it("equals 20 / 50 / 100", () => {
    expect([...PRESET_CHIPS]).toEqual([20, 50, 100]);
  });

  it("exports ALL_CHIP as ALL", () => {
    expect(ALL_CHIP).toBe("ALL");
  });

  it("every numeric chip is within display min and max inclusive", () => {
    for (const value of PRESET_CHIPS) {
      expect(value).toBeGreaterThanOrEqual(DISPLAY_MIN);
      expect(value).toBeLessThanOrEqual(DISPLAY_MAX);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("omits the 1000 all-in as a numeric preset (ALL fills max affordable)", () => {
    expect(PRESET_CHIPS).not.toContain(DISPLAY_MAX);
  });

  // PRESET_CHIPS is data-only — no placeBet helper here.
  // Fill-only wiring lives in CrashHud (chip click → bet-input.value).
});

describe("maxAffordableStake (ALL chip)", () => {
  it("floors balance and clamps to DISPLAY_MAX", () => {
    expect(maxAffordableStake(250.7)).toBe(250);
    expect(maxAffordableStake(5000)).toBe(DISPLAY_MAX);
    expect(maxAffordableStake(DISPLAY_MAX + 50)).toBe(DISPLAY_MAX);
  });

  it("returns below DISPLAY_MIN when broke so caller can disable ALL", () => {
    expect(maxAffordableStake(DISPLAY_MIN - 1)).toBeLessThan(DISPLAY_MIN);
    expect(maxAffordableStake(5)).toBe(5);
    expect(maxAffordableStake(0)).toBe(0);
  });

  it("never exceeds DISPLAY_MAX", () => {
    expect(maxAffordableStake(Number.POSITIVE_INFINITY)).toBe(DISPLAY_MAX);
    expect(maxAffordableStake(1e9)).toBe(DISPLAY_MAX);
  });
});
