import { describe, expect, it } from "vitest";
import { balanceTweenValue } from "./balanceTween.js";

describe("balanceTweenValue", () => {
  it("returns from at t=0 and to at t=1", () => {
    expect(balanceTweenValue(100, 200, 0)).toBe(100);
    expect(balanceTweenValue(100, 200, 1)).toBe(200);
  });

  it("eases between from and to for mid t", () => {
    const mid = balanceTweenValue(0, 100, 0.5);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(100);
    // Ease-out: halfway time is past linear midpoint
    expect(mid).toBeGreaterThan(50);
  });

  it("clamps t outside 0..1", () => {
    expect(balanceTweenValue(10, 20, -1)).toBe(10);
    expect(balanceTweenValue(10, 20, 2)).toBe(20);
  });

  it("returns safe fallback for non-finite inputs", () => {
    expect(Number.isFinite(balanceTweenValue(NaN, 10, 0.5))).toBe(true);
    expect(Number.isFinite(balanceTweenValue(10, Infinity, 0.5))).toBe(true);
    expect(Number.isFinite(balanceTweenValue(10, 20, NaN))).toBe(true);
  });
});
