import { describe, expect, it } from "vitest";
import { createRng } from "../../../../shared/rng/createRng.js";
import { resolveCollectors } from "./resolveCollectors.js";
import { TOKEN_COLOR_ORDER } from "./TokenColors.js";

const oddsAll = {
  meterTarget: 6,
  perSpinChance: { green: 1, red: 1, purple: 1 },
  triggerChance: { green: 1, red: 1, purple: 1 },
};

const oddsNoTrigger = {
  ...oddsAll,
  triggerChance: { green: 0, red: 0, purple: 0 },
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
      expect(s.triggers).toBe(true);
    }
    expect(out.queue).toEqual(["green", "red", "purple"]);
  });

  it("yields an empty queue when triggerChance is 0", () => {
    const out = resolveCollectors({
      rng: createRng("collectors-no-trig"),
      tokenOdds: oddsNoTrigger,
      reels: 5,
      rows: 4,
    });
    expect(out.spawns).toHaveLength(3);
    expect(out.spawns.every((s) => s.triggers === false)).toBe(true);
    expect(out.queue).toEqual([]);
  });

  it("never lists purple before green when both fire", () => {
    const out = resolveCollectors({
      rng: createRng("collectors-order"),
      tokenOdds: oddsAll,
      reels: 5,
      rows: 4,
    });
    const gi = out.queue.indexOf("green");
    const pi = out.queue.indexOf("purple");
    expect(gi).toBeGreaterThanOrEqual(0);
    expect(pi).toBeGreaterThanOrEqual(0);
    expect(gi).toBeLessThan(pi);
  });

  it("keeps green before purple when red does not spawn", () => {
    const out = resolveCollectors({
      rng: createRng("collectors-gap-red"),
      tokenOdds: {
        meterTarget: 6,
        perSpinChance: { green: 1, red: 0, purple: 1 },
        triggerChance: { green: 1, red: 1, purple: 1 },
      },
      reels: 5,
      rows: 4,
    });
    expect(out.spawns.map((s) => s.color)).toEqual(["green", "purple"]);
    expect(out.queue).toEqual(["green", "purple"]);
  });
});
