import { describe, expect, it } from "vitest";
import {
  payoutCents,
  toMultHundredths,
} from "../../../../shared/money/cents.js";
import { createRng } from "../../../../shared/rng/createRng.js";
import { loadHotlineConfig } from "../../config/loadHotlineConfig.js";
import { createPickEm } from "./pickEm.js";

const config = loadHotlineConfig();
const betCents = config.math.betStepsCents[0];

describe("createPickEm", () => {
  it("assigns twelve lockers and five picks left at start", () => {
    const pick = createPickEm({
      rng: createRng("pick-board"),
      config,
      betCents,
    });
    const snap = pick.snapshot();
    expect(snap.lockers).toHaveLength(12);
    expect(snap.picksLeft).toBe(5);
    expect(snap.opened).toEqual([]);
    expect(pick.isDone()).toBe(false);
  });

  it("accepts five distinct picks then ignores further and invalid picks", () => {
    const pick = createPickEm({
      rng: createRng("pick-cap"),
      config,
      betCents,
    });
    expect(pick.pick(0)).not.toBeNull();
    expect(pick.pick(0)).toBeNull();
    expect(pick.pick(-1)).toBeNull();
    expect(pick.pick(12)).toBeNull();
    expect(pick.pick(1)).not.toBeNull();
    expect(pick.pick(2)).not.toBeNull();
    expect(pick.pick(3)).not.toBeNull();
    expect(pick.pick(4)).not.toBeNull();
    expect(pick.isDone()).toBe(true);
    expect(pick.pick(5)).toBeNull();
    expect(pick.snapshot().picksLeft).toBe(0);
    expect(pick.snapshot().opened).toHaveLength(5);
  });

  it("totals opened lockers with integer payoutCents only", () => {
    const pick = createPickEm({
      rng: createRng("pick-total"),
      config,
      betCents,
    });
    for (const idx of [0, 1, 2, 3, 4]) pick.pick(idx);
    const snap = pick.snapshot();
    const expected = snap.opened.reduce((sum, i) => {
      return sum + payoutCents(betCents, toMultHundredths(snap.lockers[i]));
    }, 0);
    expect(pick.totalCents()).toBe(expected);
    expect(pick.totalCents()).toBeGreaterThan(0);
  });

  it("replays identical lockers and total for the same seed and pick order", () => {
    const a = createPickEm({
      rng: createRng("pick-replay"),
      config,
      betCents,
    });
    const b = createPickEm({
      rng: createRng("pick-replay"),
      config,
      betCents,
    });
    expect(a.snapshot().lockers).toEqual(b.snapshot().lockers);
    for (const idx of [11, 2, 7, 0, 5]) {
      expect(a.pick(idx)).toBe(b.pick(idx));
    }
    expect(a.totalCents()).toBe(b.totalCents());
    expect(a.isDone()).toBe(true);
  });
});
