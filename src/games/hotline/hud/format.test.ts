import { describe, expect, it } from "vitest";
import { formatMoney } from "./format.js";

describe("hotline hud format", () => {
  it("formats money with two decimals", () => {
    expect(formatMoney(1000)).toBe("1000.00");
    expect(formatMoney(0.5)).toBe("0.50");
  });

  it("returns a dash for non finite input", () => {
    expect(formatMoney(Number.NaN)).toBe("-");
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe("-");
  });
});
