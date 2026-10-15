import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import raw from "./hotline.config.json" with { type: "json" };
import { HotlineConfigSchema } from "./HotlineConfigSchema.js";
import { loadHotlineConfig } from "./loadHotlineConfig.js";

function fixture(): Record<string, any> {
  return structuredClone(raw) as Record<string, any>;
}

describe("HotlineConfigSchema", () => {
  it("parses the bundled envelope", () => {
    const cfg = HotlineConfigSchema.parse(fixture());
    expect(cfg.gameId).toBe("hotline");
    expect(cfg.math.rows).toBe(4);
    expect(cfg.math.reels).toBe(5);
    expect(cfg.math.paylineCount).toBe(40);
    expect(cfg.math.paylines).toHaveLength(40);
    expect(cfg.features).toBeDefined();
  });

  it("exposes the feature tables", () => {
    const cfg = HotlineConfigSchema.parse(fixture());
    expect(cfg.features).toHaveProperty("tokenOdds");
    expect(cfg.features).toHaveProperty("bonusPrizes");
    expect(cfg.features).toHaveProperty("jackpotMultipliers");
  });

  it("uses green red purple perSpinChance keys without triggerChance", () => {
    const cfg = HotlineConfigSchema.parse(fixture());
    expect(Object.keys(cfg.features.tokenOdds.perSpinChance).sort()).toEqual([
      "green",
      "purple",
      "red",
    ]);
    expect("triggerChance" in cfg.features.tokenOdds).toBe(false);
    for (const key of ["green", "red", "purple"] as const) {
      expect(cfg.features.tokenOdds.perSpinChance[key]).toBeGreaterThanOrEqual(0);
      expect(cfg.features.tokenOdds.perSpinChance[key]).toBeLessThanOrEqual(1);
    }
  });

  it("parses when triggerChance is absent from raw tokenOdds", () => {
    const rawOdds = fixture();
    delete rawOdds.features.tokenOdds.triggerChance;
    expect(() => HotlineConfigSchema.parse(rawOdds)).not.toThrow();
  });

  it("rejects leftover triggerChance on tokenOdds", () => {
    const bad = fixture();
    bad.features.tokenOdds.triggerChance = { green: 0.1, red: 0.1, purple: 0.1 };
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
  });

  it("throws ZodError when a perSpinChance is outside 0..1", () => {
    const bad = fixture();
    bad.features.tokenOdds.perSpinChance = { green: 1.5, red: 0.1, purple: 0.1 };
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
    bad.features.tokenOdds.perSpinChance = { green: -0.1, red: 0.1, purple: 0.1 };
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
  });

  it("throws ZodError when math is missing", () => {
    const bad = fixture();
    delete bad.math;
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
  });

  it("throws ZodError on a wrong grid size", () => {
    const bad = fixture();
    bad.math.rows = 3;
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
  });

  it("throws ZodError when a payline row is out of range", () => {
    const bad = fixture();
    bad.math.paylines[0][2] = 4;
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
  });

  it("throws ZodError when the wild symbol has no weight", () => {
    const bad = fixture();
    bad.math.wildSymbolId = "ghost";
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
  });

  it("throws ZodError when a feature table is missing", () => {
    const bad = fixture();
    delete bad.features.jackpotMultipliers;
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
  });

  it("rejects freeSpins wildWeights length other than 4", () => {
    const bad = fixture();
    bad.features.freeSpins.wildWeights = [9, 9, 9];
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
  });

  it("rejects freeSpins wildWeights not above the base wild weight", () => {
    const bad = fixture();
    bad.features.freeSpins.wildWeights = [3, 9, 9, 9];
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
  });

  it("rejects retriggerChance above 1", () => {
    const bad = fixture();
    bad.features.freeSpins.retriggerChance = 1.5;
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
  });

  it("rejects maxRetriggers below 0", () => {
    const bad = fixture();
    bad.features.freeSpins.maxRetriggers = -1;
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
  });

  it("rejects pickEm lockers other than 12", () => {
    const bad = fixture();
    bad.features.pickEm.lockers = 11;
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
  });

  it("rejects pickEm picks other than 5", () => {
    const bad = fixture();
    bad.features.pickEm.picks = 6;
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
  });

  it("rejects prizeWeights length mismatch", () => {
    const bad = fixture();
    bad.features.bonusPrizes[0].prizeWeights = [1, 2];
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
  });

  it("rejects missing pickEm or holdAndWin bonusId", () => {
    const bad = fixture();
    bad.features.bonusPrizes = bad.features.bonusPrizes.filter(
      (b: { bonusId: string }) => b.bonusId !== "pickEm",
    );
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
    const badHold = fixture();
    badHold.features.bonusPrizes = badHold.features.bonusPrizes.filter(
      (b: { bonusId: string }) => b.bonusId !== "holdAndWin",
    );
    expect(() => HotlineConfigSchema.parse(badHold)).toThrow(ZodError);
  });

  it("rejects holdAndWin startCells outside 1..19", () => {
    const badLow = fixture();
    badLow.features.holdAndWin.startCells = 0;
    expect(() => HotlineConfigSchema.parse(badLow)).toThrow(ZodError);
    const badHigh = fixture();
    badHigh.features.holdAndWin.startCells = 20;
    expect(() => HotlineConfigSchema.parse(badHigh)).toThrow(ZodError);
  });

  it("bundles gamble knobs of one round and an even chance", () => {
    const cfg = HotlineConfigSchema.parse(fixture());
    expect(cfg.features.gamble.maxRounds).toBe(1);
    expect(cfg.features.gamble.surviveChance).toBe(0.5);
  });

  it("throws ZodError when features.gamble is missing", () => {
    const bad = fixture();
    delete bad.features.gamble;
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
  });

  it("rejects gamble maxRounds that is not a positive integer", () => {
    for (const value of [0, -1, 2.5]) {
      const bad = fixture();
      bad.features.gamble.maxRounds = value;
      expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
    }
  });

  it("rejects gamble surviveChance outside 0..1", () => {
    for (const value of [-0.1, 1.2]) {
      const bad = fixture();
      bad.features.gamble.surviveChance = value;
      expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
    }
  });

  it("rejects holdAndWin landChance above 1", () => {
    const bad = fixture();
    bad.features.holdAndWin.landChance = 1.1;
    expect(() => HotlineConfigSchema.parse(bad)).toThrow(ZodError);
  });
});

describe("loadHotlineConfig", () => {
  it("returns the parsed bundled config", () => {
    const cfg = loadHotlineConfig();
    expect(cfg).toEqual(HotlineConfigSchema.parse(fixture()));
    expect(cfg.gameId).toBe("hotline");
  });
});
