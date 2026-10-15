import { describe, expect, it } from "vitest";
import { formatWaitCountdown } from "./formatWaitCountdown.js";

describe("formatWaitCountdown - continuous tenths from waitRemainingMs", () => {
  it("formats 5000 ms as 5.0", () => {
    expect(formatWaitCountdown(5000)).toBe("5.0");
  });

  it("formats 4900 ms as 4.9", () => {
    expect(formatWaitCountdown(4900)).toBe("4.9");
  });

  it("clamps 0 and negative values to 0.0", () => {
    expect(formatWaitCountdown(0)).toBe("0.0");
    expect(formatWaitCountdown(-100)).toBe("0.0");
  });

  it("never appends × suffix", () => {
    expect(formatWaitCountdown(5000)).not.toContain("×");
    expect(formatWaitCountdown(4900)).not.toContain("×");
    expect(formatWaitCountdown(0)).not.toContain("×");
  });
});
