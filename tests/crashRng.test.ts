import { describe, expect, it } from "vitest";
import { sampleCrashAt } from "../src/games/crash/logic/CrashRng.js";
import { CRASH_CONFIG } from "../src/games/crash/logic/config.js";
import { createRng } from "../src/shared/rng/createRng.js";

describe("crashRng — ARCH-01 seed replay", () => {
  it("same seed yields identical sampleCrashAt sequence", () => {
    const a = createRng("demo-1");
    const b = createRng("demo-1");
    const seqA = Array.from({ length: 20 }, () => sampleCrashAt(a));
    const seqB = Array.from({ length: 20 }, () => sampleCrashAt(b));
    expect(seqA).toEqual(seqB);
  });

  it("different seeds diverge", () => {
    const a = createRng("demo-1");
    const b = createRng("demo-2");
    const seqA = Array.from({ length: 10 }, () => sampleCrashAt(a));
    const seqB = Array.from({ length: 10 }, () => sampleCrashAt(b));
    expect(seqA).not.toEqual(seqB);
  });

  it("never returns below crashFloor or above crashCap (D-06, D-07)", () => {
    const rng = createRng("floor-cap-probe");
    for (let i = 0; i < 500; i++) {
      const crashAt = sampleCrashAt(rng);
      expect(crashAt).toBeGreaterThanOrEqual(CRASH_CONFIG.crashFloor);
      expect(crashAt).toBeLessThanOrEqual(CRASH_CONFIG.crashCap);
    }
  });

  it("two createGame instances with same seed share crashAt on first launch", async () => {
    const { createGame } = await import("../src/games/crash/logic/CrashGame.js");
    const g1 = createGame({ seed: "demo-1" });
    const g2 = createGame({ seed: "demo-1" });
    g1.tick(5000);
    g2.tick(5000);
    expect(g1.getSnapshot().crashAt).toBe(g2.getSnapshot().crashAt);
  });
});
