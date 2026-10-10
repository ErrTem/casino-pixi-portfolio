import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CollectorSpawn } from "../logic/collectors/resolveCollectors.js";
import {
  baselineFromMeterFills,
  formatComboStrip,
  progressiveDisplayFills,
} from "./collectPresentation.js";

function spawn(color: CollectorSpawn["color"]): CollectorSpawn {
  return { color, cell: { reel: 0, row: 0 }, triggers: false };
}

describe("progressiveDisplayFills (COLL-02)", () => {
  it("grows one land at a time from a pre-spin baseline", () => {
    const baseline = { green: 1, red: 0, purple: 2 };
    const target = 6;
    expect(progressiveDisplayFills(baseline, [], target)).toEqual([1, 0, 2]);
    expect(
      progressiveDisplayFills(baseline, [spawn("green")], target),
    ).toEqual([2, 0, 2]);
    expect(
      progressiveDisplayFills(
        baseline,
        [spawn("green"), spawn("red"), spawn("green")],
        target,
      ),
    ).toEqual([3, 1, 2]);
  });

  it("soft caps each color at meterTarget", () => {
    const baseline = { green: 5, red: 0, purple: 0 };
    expect(progressiveDisplayFills(baseline, [spawn("green")], 3)).toEqual([
      3, 0, 0,
    ]);
  });
});

describe("formatComboStrip (D-10, D-11)", () => {
  it("formats green to red to purple labels", () => {
    expect(formatComboStrip(["green", "purple"])).toBe("COMBO: Green → Purple");
    expect(formatComboStrip([])).toBe("");
  });
});

describe("baselineFromMeterFills", () => {
  it("uses raw counts so this spin is not already booked", () => {
    expect(
      baselineFromMeterFills({
        green: { count: 4, display: 3 },
        red: { count: 0, display: 0 },
        purple: { count: 1, display: 1 },
      }),
    ).toEqual({ green: 4, red: 0, purple: 1 });
  });
});

describe("mountHotlineSession collect path contracts (D-12, D-14)", () => {
  it("session source locks busy through flights and stub without double booking", () => {
    const src = readFileSync(
      join(import.meta.dirname, "mountHotlineSession.ts"),
      "utf8",
    );
    expect(src).toMatch(/setBusy\s*\(\s*true\s*\)/);
    expect(src).toMatch(/startCollectors/);
    expect(src).toMatch(/progressiveDisplayFills/);
    expect(src).toMatch(/formatComboStrip/);
    expect(src).toMatch(/resetPhoneMeter/);
    expect(src).not.toMatch(/\.increment\s*\(/);
  });

  it("session source plays collector beep events on presentation edges (D-16)", () => {
    const src = readFileSync(
      join(import.meta.dirname, "mountHotlineSession.ts"),
      "utf8",
    );
    expect(src).toMatch(/play\s*\(\s*["']token_spawn["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']token_land["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']phone_trigger["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']queue_step["']\s*\)/);
    expect(src).toMatch(/unlock\s*\(\s*\)/);
  });
});
