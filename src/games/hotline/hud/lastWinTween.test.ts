import { describe, expect, it } from "vitest";
import { createLastWinTween, lastWinTweenValue } from "./lastWinTween.js";

describe("lastWinTweenValue", () => {
  it("returns from at t=0 and to at t=1", () => {
    expect(lastWinTweenValue(0, 12.5, 0)).toBe(0);
    expect(lastWinTweenValue(0, 12.5, 1)).toBe(12.5);
  });

  it("eases out between the endpoints", () => {
    const mid = lastWinTweenValue(0, 100, 0.5);
    expect(mid).toBeGreaterThan(50);
    expect(mid).toBeLessThan(100);
  });

  it("clamps t outside 0..1 and non finite t", () => {
    expect(lastWinTweenValue(10, 20, -1)).toBe(10);
    expect(lastWinTweenValue(10, 20, 5)).toBe(20);
    expect(lastWinTweenValue(10, 20, NaN)).toBe(10);
  });

  it("falls back to a finite number for bad endpoints", () => {
    expect(lastWinTweenValue(NaN, 10, 0.5)).toBe(10);
    expect(lastWinTweenValue(4, Infinity, 0.5)).toBe(4);
    expect(lastWinTweenValue(NaN, NaN, 0.5)).toBe(0);
  });
});

describe("createLastWinTween", () => {
  it("counts up from zero to the target over the duration", () => {
    const tween = createLastWinTween(1000);
    expect(tween.start(5, 0)).toBe(0);
    expect(tween.valueAt(0)).toBe(0);
    const mid = tween.valueAt(500);
    expect(mid).toBeGreaterThan(2.5);
    expect(mid).toBeLessThan(5);
    expect(tween.valueAt(1000)).toBe(5);
    expect(tween.isDone(1000)).toBe(true);
    expect(tween.isDone(400)).toBe(false);
  });

  it("jumps straight to the target with a zero duration", () => {
    const tween = createLastWinTween(0);
    tween.start(3.2, 100);
    expect(tween.valueAt(100)).toBe(3.2);
    expect(tween.isDone(100)).toBe(true);
  });

  it("restarts from zero on the next start call", () => {
    const tween = createLastWinTween(1000);
    tween.start(5, 0);
    tween.start(2, 2000);
    expect(tween.valueAt(2000)).toBe(0);
    expect(tween.valueAt(3000)).toBe(2);
  });
});
