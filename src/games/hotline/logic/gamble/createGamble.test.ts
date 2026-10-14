import { describe, expect, it } from "vitest";
import { createRng, type Rng } from "../../../../shared/rng/createRng.js";
import { createGamble } from "./createGamble.js";

const opts = { maxRounds: 10, surviveChance: 0.5 };

// fixed rng so each case picks survive or die on purpose
function fixed(...values: number[]): Rng {
  let i = 0;
  return { next: () => values[Math.min(i++, values.length - 1)] };
}

describe("createGamble", () => {
  it("starts with no offer", () => {
    const g = createGamble(opts);
    expect(g.snapshot()).toEqual({ stakeCents: 0, roundsDone: 0, offered: false });
    expect(g.resolve(fixed(0.1))).toBeNull();
  });

  it("offer sets the stake and opens the pot", () => {
    const g = createGamble(opts);
    g.offer(250);
    expect(g.snapshot()).toEqual({ stakeCents: 250, roundsDone: 0, offered: true });
  });

  it("ignores a non positive or fractional stake", () => {
    const g = createGamble(opts);
    g.offer(0);
    expect(g.snapshot().offered).toBe(false);
    g.offer(-5);
    expect(g.snapshot().offered).toBe(false);
    g.offer(10.5);
    expect(g.snapshot().offered).toBe(false);
  });

  it("survive doubles the stake and counts the round", () => {
    const g = createGamble(opts);
    g.offer(100);
    const res = g.resolve(fixed(0.49));
    expect(res).toEqual({ survived: true, stakeCents: 200, roundsDone: 1, offered: true });
    expect(g.snapshot()).toEqual({ stakeCents: 200, roundsDone: 1, offered: true });
  });

  it("die closes the pot and zeroes the stake", () => {
    const g = createGamble(opts);
    g.offer(100);
    const res = g.resolve(fixed(0.5));
    expect(res).toEqual({ survived: false, stakeCents: 0, roundsDone: 0, offered: false });
    expect(g.snapshot()).toEqual({ stakeCents: 0, roundsDone: 0, offered: false });
    expect(g.resolve(fixed(0.1))).toBeNull();
  });

  it("clear drops the offer", () => {
    const g = createGamble(opts);
    g.offer(100);
    g.clear();
    expect(g.snapshot()).toEqual({ stakeCents: 0, roundsDone: 0, offered: false });
  });

  it("a new offer restarts the round count", () => {
    const g = createGamble(opts);
    g.offer(100);
    g.resolve(fixed(0.1));
    g.offer(40);
    expect(g.snapshot()).toEqual({ stakeCents: 40, roundsDone: 0, offered: true });
  });

  it("same seed on the gamble stream gives the same survive die run", () => {
    const run = (seed: string) => {
      const g = createGamble(opts);
      const rng = createRng(`${seed}:gamble`);
      const out: boolean[] = [];
      for (let i = 0; i < 6; i++) {
        g.offer(100);
        for (;;) {
          const res = g.resolve(rng);
          if (!res) break;
          out.push(res.survived);
        }
      }
      return out;
    };
    expect(run("replay")).toEqual(run("replay"));
    expect(run("replay").length).toBeGreaterThan(5);
    expect(run("replay")).not.toEqual(run("other"));
  });

  it("stops offering after maxRounds survives", () => {
    const g = createGamble({ maxRounds: 3, surviveChance: 0.5 });
    g.offer(100);
    expect(g.resolve(fixed(0.1))?.offered).toBe(true);
    expect(g.resolve(fixed(0.1))?.offered).toBe(true);
    const last = g.resolve(fixed(0.1));
    expect(last).toEqual({ survived: true, stakeCents: 800, roundsDone: 3, offered: false });
    expect(g.resolve(fixed(0.1))).toBeNull();
  });
});
