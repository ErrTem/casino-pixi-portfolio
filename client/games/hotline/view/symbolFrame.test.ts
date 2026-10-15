import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { HIGH_FRAME_IDS, frameColorFor, isHighFrameSymbol } from "./symbolFrame.js";

const here = dirname(fileURLToPath(import.meta.url));

describe("symbolFrame", () => {
  it("lists the four high frame ids", () => {
    expect([...HIGH_FRAME_IDS]).toEqual(["mask", "cassette", "pistol", "car"]);
  });

  it("recognizes high ids and rejects lows", () => {
    expect(isHighFrameSymbol("mask")).toBe(true);
    expect(isHighFrameSymbol("cassette")).toBe(true);
    expect(isHighFrameSymbol("pistol")).toBe(true);
    expect(isHighFrameSymbol("car")).toBe(true);
    expect(isHighFrameSymbol("ace")).toBe(false);
    expect(isHighFrameSymbol("king")).toBe(false);
    expect(isHighFrameSymbol("")).toBe(false);
  });

  it("maps highs to locked palette colors", () => {
    expect(frameColorFor("mask")).toBe(0xffc857);
    expect(frameColorFor("cassette")).toBe(0xff2e93);
    expect(frameColorFor("pistol")).toBe(0x4de8ff);
    expect(frameColorFor("car")).toBe(0xff3355);
    expect(frameColorFor("ace")).toBeUndefined();
    expect(frameColorFor("queen")).toBeUndefined();
  });

  it("has no pixi.js import", () => {
    const src = readFileSync(join(here, "symbolFrame.ts"), "utf8");
    expect(src).not.toMatch(/from\s+["']pixi\.js["']/);
  });
});
