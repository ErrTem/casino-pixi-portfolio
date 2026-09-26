import { describe, expect, it } from "vitest";
import { PRESET_CHIPS } from "./chips.js";

/** Display-unit bet bounds (D-02 / WALT-03). */
const DISPLAY_MIN = 10;
const DISPLAY_MAX = 1000;

describe("PRESET_CHIPS (WALT-03)", () => {
  it("equals the six discretionary presets", () => {
    expect([...PRESET_CHIPS]).toEqual([10, 25, 50, 100, 250, 500]);
  });

  it("every chip is within display min 10 and max 1000 inclusive", () => {
    for (const value of PRESET_CHIPS) {
      expect(value).toBeGreaterThanOrEqual(DISPLAY_MIN);
      expect(value).toBeLessThanOrEqual(DISPLAY_MAX);
    }
  });

  it("includes the inclusive lower bound 10 as a preset", () => {
    expect(PRESET_CHIPS).toContain(DISPLAY_MIN);
    expect(PRESET_CHIPS[0]).toBe(DISPLAY_MIN);
  });

  it("omits the 1000 all-in chip (upper bound is free-form facade only)", () => {
    expect(PRESET_CHIPS).not.toContain(DISPLAY_MAX);
    // Bound probe: max 1000 is a valid placeBet ceiling, not a chip button.
    expect(DISPLAY_MAX).toBe(1000);
    for (const value of PRESET_CHIPS) {
      expect(value).toBeLessThan(DISPLAY_MAX);
    }
  });

  it("boundary probe: presets sit at or inside [10, 1000]; none are one-step outside", () => {
    // One step outside the allowed display range must never appear as a chip.
    expect(PRESET_CHIPS).not.toContain(DISPLAY_MIN - 1); // 9
    expect(PRESET_CHIPS).not.toContain(DISPLAY_MAX + 1); // 1001
    for (const value of PRESET_CHIPS) {
      expect(value).toBeGreaterThanOrEqual(DISPLAY_MIN);
      expect(value).toBeLessThanOrEqual(DISPLAY_MAX);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  // PRESET_CHIPS is data-only — no placeBet helper here.
  // Fill-only wiring lives in CrashHud (chip click → bet-input.value).
  //
  // WALT-03 precision probe — SKIP (N/A):
  // Chip presets are integer display units only. No HUD rounding, float
  // conversion, or tie-break logic exists in chips.ts; GameLogic owns
  // cents conversion via placeBet. Inventing float tests would not probe
  // real behavior.
});
