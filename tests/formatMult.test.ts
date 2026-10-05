import { describe, expect, it } from "vitest";
import { formatMult } from "../src/games/crash/hud/format.js";

describe("formatMult - theater display strings (T-03-07)", () => {
  it("formats finite multipliers as two-decimal × strings for BitmapText.text", () => {
    expect(formatMult(1)).toBe("1.00×");
    expect(formatMult(1.42)).toBe("1.42×");
    expect(formatMult(2.456)).toBe("2.46×");
    expect(formatMult(10)).toBe("10.00×");
  });

  it("non-finite multipliers become an em dash (no NaN string for canvas text)", () => {
    expect(formatMult(Number.NaN)).toBe("-");
    expect(formatMult(Number.POSITIVE_INFINITY)).toBe("-");
    expect(formatMult(Number.NEGATIVE_INFINITY)).toBe("-");
  });

  it("output never contains HTML markup (safe for BitmapText.text assignment)", () => {
    for (const m of [1, 1.5, 8.21, Number.NaN]) {
      const s = formatMult(m);
      expect(s).not.toMatch(/<|>|&lt;|innerHTML|script/i);
    }
  });
});
