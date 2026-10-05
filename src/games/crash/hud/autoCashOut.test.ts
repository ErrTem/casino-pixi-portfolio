import { describe, expect, it } from "vitest";
import { CRASH_CONFIG } from "../logic/config.js";
import { clampAutoCashOut } from "./autoCashOut.js";

describe("clampAutoCashOut", () => {
  it("clamps to crashFloor .. crashCap", () => {
    expect(clampAutoCashOut(1)).toBe(CRASH_CONFIG.crashFloor);
    expect(clampAutoCashOut(CRASH_CONFIG.crashCap + 50)).toBe(
      CRASH_CONFIG.crashCap,
    );
    expect(clampAutoCashOut(2.5)).toBe(2.5);
  });

  it("rounds to 2dp", () => {
    expect(clampAutoCashOut(2.456)).toBe(2.46);
  });

  it("falls back on non-finite", () => {
    expect(clampAutoCashOut(Number.NaN)).toBe(CRASH_CONFIG.crashFloor);
    expect(clampAutoCashOut(Number.POSITIVE_INFINITY)).toBe(
      CRASH_CONFIG.crashFloor,
    );
  });
});
