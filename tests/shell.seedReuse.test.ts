import { describe, expect, it } from "vitest";
import { createGame } from "../src/games/crash/logic/CrashGame.js";
import { CRASH_CONFIG } from "../src/games/crash/logic/config.js";
import {
  DEFAULT_DEMO_SEED,
  parseBootSeed,
} from "../src/shared/boot/parseBootSeed.js";

/** drive a seeded crash game with fixed ticks until three rounds land in history */
function historyAfterThreeRounds(seed: string): number[] {
  const game = createGame({ seed });
  let guard = 0;
  while (game.getSnapshot().history.length < 3 && guard < 200_000) {
    game.tick(CRASH_CONFIG.maxDeltaMs);
    guard += CRASH_CONFIG.maxDeltaMs;
  }
  return [...game.getSnapshot().history];
}

describe("CFG-02 / D-11 seed reuse across launches", () => {
  it('parseBootSeed("?seed=abc") yields abc', () => {
    expect(parseBootSeed("?seed=abc").seed).toBe("abc");
  });

  it("absent seed yields the deterministic default portfolio-demo", () => {
    expect(parseBootSeed("").seed).toBe(DEFAULT_DEMO_SEED);
    expect(DEFAULT_DEMO_SEED).toBe("portfolio-demo");
  });

  it("same boot seed produces identical crash history over three rounds", () => {
    const seed = parseBootSeed("?seed=abc").seed;
    const a = historyAfterThreeRounds(seed);
    const b = historyAfterThreeRounds(seed);
    expect(a).toHaveLength(3);
    expect(a).toEqual(b);
  });

  it("different seed produces a different crash history", () => {
    const same = historyAfterThreeRounds(parseBootSeed("?seed=abc").seed);
    const other = historyAfterThreeRounds("other-seed");
    expect(other).toHaveLength(3);
    expect(other).not.toEqual(same);
  });
});
