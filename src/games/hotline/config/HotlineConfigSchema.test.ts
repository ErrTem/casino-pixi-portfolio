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
});

describe("loadHotlineConfig", () => {
  it("returns the parsed bundled config", () => {
    const cfg = loadHotlineConfig();
    expect(cfg).toEqual(HotlineConfigSchema.parse(fixture()));
    expect(cfg.gameId).toBe("hotline");
  });
});
