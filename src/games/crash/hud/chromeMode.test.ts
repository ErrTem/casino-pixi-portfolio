import { describe, expect, it } from "vitest";
import type { Phase } from "../logic/index.js";
import { chromeModeFrom } from "./chromeMode.js";

describe("chromeModeFrom — phase → promote chrome", () => {
  it("flying → promote-cashout", () => {
    expect(chromeModeFrom("flying")).toBe("promote-cashout");
  });

  it("cashed_out → promote-cashout (D-08 — disabled Cash out still promoted)", () => {
    expect(chromeModeFrom("cashed_out")).toBe("promote-cashout");
  });

  it("waiting → normal", () => {
    expect(chromeModeFrom("waiting")).toBe("normal");
  });

  it("crashed → normal", () => {
    expect(chromeModeFrom("crashed")).toBe("normal");
  });

  it("covers the full Phase union without inventing idle", () => {
    const phases: Phase[] = ["waiting", "flying", "cashed_out", "crashed"];
    for (const phase of phases) {
      const mode = chromeModeFrom(phase);
      expect(mode === "normal" || mode === "promote-cashout").toBe(true);
    }
  });
});
