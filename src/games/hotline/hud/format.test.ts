import { describe, expect, it } from "vitest";
import { formatMoney, formatWinCallout } from "./format.js";

describe("hotline hud format", () => {
  it("formats money with two decimals", () => {
    expect(formatMoney(1000)).toBe("1000.00");
    expect(formatMoney(0.5)).toBe("0.50");
  });

  it("returns a dash for non finite input", () => {
    expect(formatMoney(Number.NaN)).toBe("-");
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe("-");
  });

  it("formats a win callout in dollars from cents", () => {
    expect(formatWinCallout(10)).toBe("$0.10");
    expect(formatWinCallout(12345)).toBe("$123.45");
    expect(formatWinCallout(0)).toBe("$0.00");
  });

  it("keeps the callout dash free of a dollar sign", () => {
    expect(formatWinCallout(Number.NaN)).toBe("-");
  });
});
