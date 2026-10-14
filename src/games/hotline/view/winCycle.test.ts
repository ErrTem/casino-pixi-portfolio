import { describe, expect, it } from "vitest";
import { createWinCycle } from "./winCycle.js";

describe("createWinCycle", () => {
  it("starts on the first line and advances after one interval", () => {
    const cycle = createWinCycle(1000);
    cycle.reset(2);
    expect(cycle.active()).toBe(0);
    expect(cycle.isDone()).toBe(false);
    expect(cycle.advance(400)).toBe(false);
    expect(cycle.active()).toBe(0);
    expect(cycle.advance(600)).toBe(true);
    expect(cycle.active()).toBe(1);
    expect(cycle.isDone()).toBe(false);
  });

  it("wraps forever and is not done while lines remain", () => {
    const cycle = createWinCycle(500);
    cycle.reset(2);
    cycle.advance(500);
    expect(cycle.active()).toBe(1);
    expect(cycle.isDone()).toBe(false);
    expect(cycle.advance(500)).toBe(true);
    expect(cycle.active()).toBe(0);
    expect(cycle.isDone()).toBe(false);
    expect(cycle.advance(500)).toBe(true);
    expect(cycle.active()).toBe(1);
  });

  it("keeps a single line active across intervals", () => {
    const cycle = createWinCycle(300);
    cycle.reset(1);
    expect(cycle.active()).toBe(0);
    expect(cycle.isDone()).toBe(false);
    expect(cycle.advance(299)).toBe(false);
    expect(cycle.isDone()).toBe(false);
    expect(cycle.advance(1)).toBe(true);
    expect(cycle.active()).toBe(0);
    expect(cycle.isDone()).toBe(false);
  });

  it("reports no active line when empty", () => {
    const cycle = createWinCycle(300);
    cycle.reset(0);
    expect(cycle.active()).toBe(-1);
    expect(cycle.isDone()).toBe(true);
    expect(cycle.advance(1000)).toBe(false);
  });

  it("steps one line per call even after a long frame", () => {
    const cycle = createWinCycle(100);
    cycle.reset(5);
    cycle.advance(10_000);
    expect(cycle.active()).toBe(1);
    expect(cycle.isDone()).toBe(false);
  });

  it("ignores bad deltas", () => {
    const cycle = createWinCycle(100);
    cycle.reset(3);
    expect(cycle.advance(NaN)).toBe(false);
    expect(cycle.advance(-50)).toBe(false);
    expect(cycle.active()).toBe(0);
    expect(cycle.isDone()).toBe(false);
  });
});
