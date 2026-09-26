import { describe, expect, it } from "vitest";
import { historyClass, orderNewestFirst } from "./historyStrip.js";

describe("orderNewestFirst (WALT-05)", () => {
  it("reverses oldest→newest ring so newest is first", () => {
    expect(orderNewestFirst([1.5, 3, 12])).toEqual([12, 3, 1.5]);
  });

  it("returns empty array for empty history", () => {
    expect(orderNewestFirst([])).toEqual([]);
  });
});

describe("historyClass thresholds (WALT-05)", () => {
  it("classifies below 2 as hist--low", () => {
    expect(historyClass(1.99)).toBe("hist hist--low");
    expect(historyClass(1.01)).toBe("hist hist--low");
  });

  it("classifies 2 through 10 as hist--mid", () => {
    expect(historyClass(2)).toBe("hist hist--mid");
    expect(historyClass(10)).toBe("hist hist--mid");
  });

  it("classifies above 10 as hist--high", () => {
    expect(historyClass(10.01)).toBe("hist hist--high");
    expect(historyClass(12)).toBe("hist hist--high");
  });
});
