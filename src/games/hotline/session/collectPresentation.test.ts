import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CollectorSpawn } from "../logic/collectors/resolveCollectors.js";
import type { NightSnapshot } from "../logic/index.js";
import * as collectPresentation from "./collectPresentation.js";
import {
  baselineFromMeterFills,
  formatComboStrip,
  progressiveDisplayFills,
} from "./collectPresentation.js";

function nightWithFs(
  spinsLeft: number,
  totalCents: number,
): NightSnapshot {
  return {
    path: [{ color: "green", nested: false, state: "active" }],
    activeIndex: 0,
    fs: {
      spinsLeft,
      spinsDone: 0,
      totalSpins: 24,
      retriggers: 0,
      totalCents,
    },
    totalCents: 0,
    featureBetCents: 100,
  };
}

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

describe("formatFeatureLine (D-02)", () => {
  it("returns empty when night or fs frame is absent", () => {
    expect(typeof collectPresentation.formatFeatureLine).toBe("function");
    expect(collectPresentation.formatFeatureLine(null)).toBe("");
    expect(
      collectPresentation.formatFeatureLine({
        path: [{ color: "green", nested: false, state: "active" }],
        activeIndex: 0,
        fs: null,
        totalCents: 0,
        featureBetCents: 100,
      }),
    ).toBe("");
  });

  it("formats remaining spins and running free spin win", () => {
    expect(typeof collectPresentation.formatFeatureLine).toBe("function");
    expect(collectPresentation.formatFeatureLine(nightWithFs(12, 1840))).toBe(
      "FREE SPINS 12 LEFT  WIN 18.40",
    );
  });

  it("formats zero spins left with the running total", () => {
    expect(typeof collectPresentation.formatFeatureLine).toBe("function");
    expect(collectPresentation.formatFeatureLine(nightWithFs(0, 250))).toBe(
      "FREE SPINS 0 LEFT  WIN 2.50",
    );
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
    expect(src).toMatch(/nextNightStep/);
    expect(src).toMatch(/spinFree/);
    expect(src).toMatch(/mountFeatureOverlay/);
    expect(src).toMatch(/setFeatureLine/);
    expect(src).toMatch(/formatFeatureLine/);
    expect(src).toMatch(/setWinCycleMs/);
    expect(src).toMatch(/FS_WIN_CYCLE_MS/);
    expect(src).toMatch(/FS_GAP_MS/);
    expect(src).toMatch(/pickLocker/);
    expect(src).toMatch(/showLockerGrid/);
    expect(src).toMatch(/hideLockers/);
    expect(src).toMatch(/setHoldMode/);
    expect(src).toMatch(/stepHoldRespin/);
    expect(src).toMatch(/hold_respin/);
    expect(src).toMatch(/HoldLayer|syncHold/);
    expect(src).toMatch(/setComboPath/);
    expect(src).toMatch(/buildComboStripCells/);
    expect(src).toMatch(/night_total/);
    expect(src).toMatch(/COMBO NIGHT/);
    expect(src).not.toMatch(/FEATURE_BEAT_MS/);
    expect(src).not.toMatch(/\.increment\s*\(/);
    const overlaySrc = readFileSync(
      join(import.meta.dirname, "../hud/FeatureOverlay.ts"),
      "utf8",
    );
    expect(overlaySrc).toMatch(/locker-pick/);
    expect(overlaySrc).not.toMatch(/\.innerHTML\s*=/);
  });

  it("session source plays collector beep events on presentation edges (D-16)", () => {
    const src = readFileSync(
      join(import.meta.dirname, "mountHotlineSession.ts"),
      "utf8",
    );
    expect(src).toMatch(/play\s*\(\s*["']token_spawn["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']token_land["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']phone_trigger["']\s*\)/);
    expect(src).toMatch(/unlock\s*\(\s*\)/);
  });

  it("session source plays feature beep events on bonus edges (04-05)", () => {
    const src = readFileSync(
      join(import.meta.dirname, "mountHotlineSession.ts"),
      "utf8",
    );
    expect(src).toMatch(/play\s*\(\s*["']feature_start["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']feature_end["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']hold_land["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']hold_respin["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']pick_reveal["']\s*\)/);
    expect(src).toMatch(/play\s*\(\s*["']jackpot["']\s*\)/);
  });
});
