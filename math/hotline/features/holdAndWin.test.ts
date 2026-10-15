import { describe, expect, it } from "vitest";
import {
  payoutCents,
  toMultHundredths,
} from "../../money/cents.js";
import { createRng } from "../../rng/createRng.js";
import type { HotlineConfig } from "../config/HotlineConfigSchema.js";
import { loadHotlineConfig } from "../config/loadHotlineConfig.js";
import { createHoldAndWin } from "./holdAndWin.js";

const config = loadHotlineConfig();
const betCents = config.math.betStepsCents[0];

function withHold(
  patch: Partial<HotlineConfig["features"]["holdAndWin"]>,
): HotlineConfig {
  return {
    ...config,
    features: {
      ...config.features,
      holdAndWin: { ...config.features.holdAndWin, ...patch },
    },
  };
}

describe("createHoldAndWin", () => {
  it("seeds startCells distinct cash prizes and lives equal respins", () => {
    const cfg = withHold({ startCells: 5, respins: 3 });
    const hold = createHoldAndWin({
      rng: createRng("hold-start"),
      config: cfg,
      betCents,
    });
    hold.start();
    const snap = hold.snapshot();
    expect(snap.cells).toHaveLength(5);
    expect(snap.lives).toBe(3);
    expect(snap.done).toBe(false);
    const indexes = snap.cells.map((c) => c.index);
    expect(new Set(indexes).size).toBe(5);
    for (const entry of snap.cells) {
      expect(entry.cell.kind).toBe("cash");
    }
  });

  it("landChance 0 burns exactly three respins then done with no new cells", () => {
    const cfg = withHold({ landChance: 0, startCells: 5, respins: 3 });
    const hold = createHoldAndWin({
      rng: createRng("hold-land0"),
      config: cfg,
      betCents,
    });
    hold.start();
    const startCount = hold.snapshot().cells.length;
    hold.respin();
    expect(hold.snapshot().lives).toBe(2);
    expect(hold.snapshot().done).toBe(false);
    hold.respin();
    expect(hold.snapshot().lives).toBe(1);
    hold.respin();
    const snap = hold.snapshot();
    expect(snap.lives).toBe(0);
    expect(snap.done).toBe(true);
    expect(snap.cells).toHaveLength(startCount);
  });

  it("landChance 1 fills the grid in one respin and awards grand on top", () => {
    const cfg = withHold({
      landChance: 1,
      jackpotSymbolChance: 0,
      startCells: 5,
      respins: 3,
    });
    const hold = createHoldAndWin({
      rng: createRng("hold-land1"),
      config: cfg,
      betCents,
    });
    hold.start();
    hold.respin();
    const snap = hold.snapshot();
    expect(snap.cells).toHaveLength(20);
    expect(snap.done).toBe(true);
    expect(snap.jackpotWon).toBe("grand");

    let cellSum = 0;
    for (const entry of snap.cells) {
      if (entry.cell.kind === "cash") {
        cellSum += payoutCents(betCents, toMultHundredths(entry.cell.mult));
      } else {
        const mult = cfg.features.jackpotMultipliers[entry.cell.tier];
        cellSum += payoutCents(betCents, toMultHundredths(mult));
      }
    }
    const grand = payoutCents(
      betCents,
      toMultHundredths(cfg.features.jackpotMultipliers.grand),
    );
    expect(hold.totalCents()).toBe(cellSum + grand);
  });

  it("resets lives to respins when at least one cell lands", () => {
    const cfg = withHold({
      landChance: 1,
      jackpotSymbolChance: 0,
      startCells: 5,
      respins: 3,
    });
    const mid = withHold({
      landChance: 0.5,
      jackpotSymbolChance: 0,
      startCells: 5,
      respins: 3,
    });
    const hold = createHoldAndWin({
      rng: createRng("hold-reset-lives"),
      config: mid,
      betCents,
    });
    hold.start();
    const before = hold.snapshot().cells.length;
    hold.respin();
    const after = hold.snapshot();
    if (after.cells.length > before) {
      expect(after.lives).toBe(3);
    } else {
      expect(after.lives).toBe(2);
    }
    const fill = createHoldAndWin({
      rng: createRng("hold-reset-fill"),
      config: cfg,
      betCents,
    });
    fill.start();
    fill.respin();
    expect(fill.snapshot().done).toBe(true);
    expect(fill.snapshot().cells.length).toBe(20);
  });

  it("totals cell payouts plus jackpot tiers with integer cents", () => {
    const cfg = withHold({
      landChance: 0,
      jackpotSymbolChance: 0,
      startCells: 5,
      respins: 3,
    });
    const hold = createHoldAndWin({
      rng: createRng("hold-total"),
      config: cfg,
      betCents,
    });
    hold.start();
    while (!hold.snapshot().done) hold.respin();
    const snap = hold.snapshot();
    let expected = 0;
    for (const entry of snap.cells) {
      if (entry.cell.kind === "cash") {
        expected += payoutCents(betCents, toMultHundredths(entry.cell.mult));
      } else {
        const mult = cfg.features.jackpotMultipliers[entry.cell.tier];
        expected += payoutCents(betCents, toMultHundredths(mult));
      }
    }
    if (snap.cells.length === 20) {
      expected += payoutCents(
        betCents,
        toMultHundredths(cfg.features.jackpotMultipliers.grand),
      );
    }
    expect(hold.totalCents()).toBe(expected);
    expect(hold.totalCents()).toBeGreaterThan(0);
  });

  it("terminates within the research bound of 63 respins", () => {
    const cfg = withHold({ landChance: 0.2, startCells: 5, respins: 3 });
    const hold = createHoldAndWin({
      rng: createRng("hold-bound"),
      config: cfg,
      betCents,
    });
    hold.start();
    expect(hold.snapshot().done).toBe(false);
    let steps = 0;
    while (!hold.snapshot().done && steps < 100) {
      hold.respin();
      steps += 1;
    }
    expect(hold.snapshot().done).toBe(true);
    expect(steps).toBeGreaterThan(0);
    expect(steps).toBeLessThanOrEqual(63);
  });

  it("draws jackpot tiers from config weights with a fixed rng sequence", () => {
    const cfg = withHold({
      landChance: 1,
      jackpotSymbolChance: 1,
      startCells: 19,
      respins: 3,
    });
    const hold = createHoldAndWin({
      rng: createRng("hold-jackpot-tiers"),
      config: cfg,
      betCents,
    });
    hold.start();
    hold.respin();
    const snap = hold.snapshot();
    const jackpots = snap.cells.filter((c) => c.cell.kind === "jackpot");
    expect(jackpots.length).toBeGreaterThan(0);
    for (const entry of jackpots) {
      if (entry.cell.kind !== "jackpot") continue;
      expect(["mini", "minor", "major"]).toContain(entry.cell.tier);
    }
  });
});
