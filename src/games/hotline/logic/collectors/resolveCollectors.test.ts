import { describe, expect, it } from "vitest";
import { createRng } from "../../../../shared/rng/createRng.js";
import { resolveCollectors } from "./resolveCollectors.js";
import { TOKEN_COLOR_ORDER } from "./TokenColors.js";

const oddsAll = {
  meterTarget: 6,
  perSpinChance: { green: 1, red: 1, purple: 1 },
};

const oddsGapRed = {
  meterTarget: 6,
  perSpinChance: { green: 1, red: 0, purple: 1 },
};

describe("resolveCollectors", () => {
  it("spawns three colors on distinct cells when all chances are 1", () => {
    const out = resolveCollectors({
      rng: createRng("collectors-all"),
      tokenOdds: oddsAll,
      reels: 5,
      rows: 4,
    });
    expect(out.spawns).toHaveLength(3);
    expect(out.spawns.map((s) => s.color)).toEqual([...TOKEN_COLOR_ORDER]);
    const keys = out.spawns.map((s) => `${s.cell.reel},${s.cell.row}`);
    expect(new Set(keys).size).toBe(3);
    for (const s of out.spawns) {
      expect(s.cell.reel).toBeGreaterThanOrEqual(0);
      expect(s.cell.reel).toBeLessThan(5);
      expect(s.cell.row).toBeGreaterThanOrEqual(0);
      expect(s.cell.row).toBeLessThan(4);
      expect("triggers" in s).toBe(false);
    }
    // queue is owned by HotlineGame meter fill, resolver stays spawn-only
    expect(out.queue).toEqual([]);
  });

  it("keeps queue empty even when every color spawns", () => {
    const out = resolveCollectors({
      rng: createRng("collectors-no-trig"),
      tokenOdds: oddsAll,
      reels: 5,
      rows: 4,
    });
    expect(out.spawns).toHaveLength(3);
    expect(out.queue).toEqual([]);
  });

  it("spawns green and purple without red when red chance is 0", () => {
    const out = resolveCollectors({
      rng: createRng("collectors-gap-red"),
      tokenOdds: oddsGapRed,
      reels: 5,
      rows: 4,
    });
    expect(out.spawns.map((s) => s.color)).toEqual(["green", "purple"]);
    expect(out.queue).toEqual([]);
  });
});
