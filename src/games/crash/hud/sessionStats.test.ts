import { describe, expect, it } from "vitest";
import { sessionStatsFrom } from "./sessionStats.js";

describe("sessionStatsFrom (PLSH-04 / D-13 / D-16)", () => {
  it("empty history returns placeholders — and n/a, never 0.00×", () => {
    const stats = sessionStatsFrom([]);
    expect(stats).toEqual({ avgLabel: "—", maxLabel: "n/a" });
    expect(JSON.stringify(stats)).not.toContain("0.00×");
  });

  it("single-element history formats that value for both avg and max", () => {
    expect(sessionStatsFrom([2.5])).toEqual({
      avgLabel: "2.50×",
      maxLabel: "2.50×",
    });
  });

  it("multi-element history computes avg and max to 2dp ×", () => {
    // (1.5 + 3 + 12) / 3 = 5.5 → 5.50×; max 12 → 12.00×
    expect(sessionStatsFrom([1.5, 3, 12])).toEqual({
      avgLabel: "5.50×",
      maxLabel: "12.00×",
    });
  });

  it("skips non-finite entries; all non-finite → placeholders", () => {
    expect(sessionStatsFrom([NaN, Infinity, -Infinity])).toEqual({
      avgLabel: "—",
      maxLabel: "n/a",
    });
  });

  it("averages only finite entries when mixed with non-finite", () => {
    // finite: 2 and 4 → avg 3.00×, max 4.00×
    expect(sessionStatsFrom([2, NaN, 4, Infinity])).toEqual({
      avgLabel: "3.00×",
      maxLabel: "4.00×",
    });
  });
});
