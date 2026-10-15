import { describe, expect, it } from "vitest";
import { shouldShowWinCallout } from "./winCalloutGate.js";

describe("shouldShowWinCallout", () => {
  it("is false when lineWins is empty", () => {
    expect(shouldShowWinCallout([])).toBe(false);
  });

  it("is false when summed payoutCents is 0", () => {
    expect(shouldShowWinCallout([{ payoutCents: 0 }, { payoutCents: 0 }])).toBe(
      false,
    );
  });

  it("is true when any payoutCents is positive", () => {
    expect(
      shouldShowWinCallout([{ payoutCents: 0 }, { payoutCents: 120 }]),
    ).toBe(true);
  });
});
