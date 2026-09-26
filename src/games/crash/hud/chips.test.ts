import { describe, expect, it } from "vitest";
import { PRESET_CHIPS } from "./chips.js";

describe("PRESET_CHIPS (WALT-03)", () => {
  it("equals the six discretionary presets", () => {
    expect([...PRESET_CHIPS]).toEqual([10, 25, 50, 100, 250, 500]);
  });

  it("every chip is within display min 10 and max 1000 inclusive", () => {
    for (const value of PRESET_CHIPS) {
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(1000);
    }
  });

  it("omits the 1000 all-in chip", () => {
    expect(PRESET_CHIPS).not.toContain(1000);
  });

  // PRESET_CHIPS is data-only — no placeBet helper here.
  // Fill-only wiring lives in CrashHud (chip click → bet-input.value).
});
