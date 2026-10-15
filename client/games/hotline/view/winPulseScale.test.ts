import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { winPulseScale } from "./winPulseScale.js";

const here = dirname(fileURLToPath(import.meta.url));

describe("winPulseScale", () => {
  it("returns 1 at elapsed 0", () => {
    expect(winPulseScale(0, 700, 1.15)).toBe(1);
  });

  it("returns approximately peak at mid period", () => {
    expect(winPulseScale(350, 700, 1.15)).toBeCloseTo(1.15, 5);
  });

  it("returns 1 at full period", () => {
    expect(winPulseScale(700, 700, 1.15)).toBeCloseTo(1, 5);
  });

  it("clamps non-finite or non-positive period and peak to 1", () => {
    expect(winPulseScale(100, 0, 1.15)).toBe(1);
    expect(winPulseScale(100, -10, 1.15)).toBe(1);
    expect(winPulseScale(100, Number.NaN, 1.15)).toBe(1);
    expect(winPulseScale(100, 700, 0)).toBe(1);
    expect(winPulseScale(100, 700, -1)).toBe(1);
    expect(winPulseScale(Number.NaN, 700, 1.15)).toBe(1);
  });

  it("has no pixi.js import", () => {
    const src = readFileSync(join(here, "winPulseScale.ts"), "utf8");
    expect(src).not.toMatch(/from\s+["']pixi\.js["']/);
  });
});
