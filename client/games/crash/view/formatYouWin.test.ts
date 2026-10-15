import { describe, expect, it } from "vitest";
import { formatYouWin } from "./formatYouWin.js";

describe("formatYouWin", () => {
  it('formats finite amounts as two-line "you win\\n$X.XX"', () => {
    expect(formatYouWin(25)).toBe("you win\n$25.00");
    expect(formatYouWin(12.5)).toBe("you win\n$12.50");
    expect(formatYouWin(0)).toBe("you win\n$0.00");
  });

  it("uses safe fallback for non-finite amounts", () => {
    expect(formatYouWin(NaN)).toBe("you win\n$-");
    expect(formatYouWin(Infinity)).toBe("you win\n$-");
    expect(formatYouWin(-Infinity)).toBe("you win\n$-");
  });
});
