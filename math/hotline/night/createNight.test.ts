import { describe, expect, it } from "vitest";
import { createNight, type Night, type NightStep } from "./createNight.js";

const FS = { spins: 3, retriggerSpins: 2, maxRetriggers: 2 };

function drainStart(night: Night): NightStep {
  const step = night.next();
  expect(step.kind).toBe("feature_start");
  return step;
}

function settleFs(night: Night, winCents = 0, queue: ("green" | "red" | "purple")[] = []): void {
  expect(night.next()).toEqual({ kind: "fs_spin" });
  night.onFsSpinSettled({ winCents, queue });
}

describe("createNight base order (D-16)", () => {
  it("runs green free spins then red then purple then night total", () => {
    const night = createNight({
      queue: ["purple", "green", "red"],
      freeSpins: FS,
      featureBetCents: 100,
    });

    expect(drainStart(night)).toMatchObject({
      kind: "feature_start",
      color: "green",
      nested: false,
    });

    for (let i = 0; i < FS.spins; i++) settleFs(night, 10);
    const greenExit = night.next();
    expect(greenExit).toMatchObject({
      kind: "feature_exit",
      color: "green",
      nested: false,
      totalCents: 30,
    });

    expect(night.next()).toMatchObject({
      kind: "feature_start",
      color: "red",
      nested: false,
    });
    night.settleFeature(50);
    expect(night.next()).toMatchObject({
      kind: "feature_exit",
      color: "red",
      totalCents: 50,
    });

    expect(night.next()).toMatchObject({
      kind: "feature_start",
      color: "purple",
      nested: false,
    });
    night.settleFeature(70);
    expect(night.next()).toMatchObject({
      kind: "feature_exit",
      color: "purple",
      totalCents: 70,
    });

    expect(night.next()).toEqual({ kind: "night_total", totalCents: 150 });
    expect(night.next()).toEqual({ kind: "done" });
  });
});

describe("createNight nesting resume (D-17)", () => {
  it("pauses free spins for red then purple nested and resumes spinsLeft", () => {
    const night = createNight({
      queue: ["green"],
      freeSpins: { spins: 5, retriggerSpins: 6, maxRetriggers: 3 },
      featureBetCents: 100,
    });
    drainStart(night);
    settleFs(night, 1);
    settleFs(night, 1);
    // after 2 spins, inject nested purple red (ordered red then purple)
    settleFs(night, 1, ["purple", "red"]);

    expect(night.next()).toMatchObject({
      kind: "feature_start",
      color: "red",
      nested: true,
    });
    const snapNested = night.snapshot();
    expect(snapNested.path.filter((e) => e.state === "active")).toHaveLength(1);
    const green = snapNested.path.find((e) => e.color === "green" && !e.nested);
    expect(green?.state).toBe("paused");
    expect(snapNested.fs?.spinsLeft).toBe(2);

    night.settleFeature(40);
    expect(night.next()).toMatchObject({
      kind: "feature_exit",
      color: "red",
      nested: true,
      totalCents: 40,
    });

    expect(night.next()).toMatchObject({
      kind: "feature_start",
      color: "purple",
      nested: true,
    });
    night.settleFeature(20);
    expect(night.next()).toMatchObject({
      kind: "feature_exit",
      color: "purple",
      nested: true,
      totalCents: 20,
    });

    // resume with spinsLeft still 2 (5 - 3 settled before nested)
    expect(night.snapshot().fs?.spinsLeft).toBe(2);
    expect(night.next()).toEqual({ kind: "fs_spin" });
    night.onFsSpinSettled({ winCents: 0, queue: [] });
    settleFs(night, 0);
    const greenExit = night.next();
    expect(greenExit).toMatchObject({ kind: "feature_exit", color: "green" });
    if (greenExit.kind !== "feature_exit") throw new Error("exit");
    // green exit excludes nested 40+20
    expect(greenExit.totalCents).toBe(3);
    expect(night.next()).toEqual({ kind: "night_total", totalCents: 63 });
    expect(night.next()).toEqual({ kind: "done" });
  });

  it("treats green in an fs queue as retrigger and never nests green", () => {
    const night = createNight({
      queue: ["green"],
      freeSpins: { spins: 2, retriggerSpins: 3, maxRetriggers: 2 },
      featureBetCents: 10,
    });
    drainStart(night);
    for (let i = 0; i < 2 + 2 * 3; i++) {
      settleFs(night, 0, ["green"]);
    }
    expect(night.snapshot().fs?.spinsDone).toBe(2 + 2 * 3);
    expect(night.snapshot().path.some((e) => e.color === "green" && e.nested)).toBe(
      false,
    );
    const exit = night.next();
    expect(exit.kind).toBe("feature_exit");
    expect(night.next()).toEqual({ kind: "done" });
  });
});

describe("createNight wait guard and night total threshold (D-19)", () => {
  it("returns wait while an fs spin is pending settle", () => {
    const night = createNight({
      queue: ["green"],
      freeSpins: FS,
      featureBetCents: 10,
    });
    drainStart(night);
    expect(night.next()).toEqual({ kind: "fs_spin" });
    const before = night.snapshot();
    expect(night.next()).toEqual({ kind: "wait" });
    expect(night.snapshot()).toEqual(before);
    night.onFsSpinSettled({ winCents: 0, queue: [] });
    expect(night.next()).toEqual({ kind: "fs_spin" });
  });

  it("returns wait while a red feature is open and unsettled", () => {
    const night = createNight({
      queue: ["red"],
      freeSpins: FS,
      featureBetCents: 10,
    });
    expect(night.next()).toMatchObject({ kind: "feature_start", color: "red" });
    const before = night.snapshot();
    expect(night.next()).toEqual({ kind: "wait" });
    expect(night.snapshot()).toEqual(before);
    night.settleFeature(0);
    expect(night.next()).toMatchObject({ kind: "feature_exit", color: "red" });
    expect(night.next()).toEqual({ kind: "done" });
  });

  it("skips night_total for a single green with no nesting", () => {
    const night = createNight({
      queue: ["green"],
      freeSpins: { spins: 1, retriggerSpins: 1, maxRetriggers: 0 },
      featureBetCents: 10,
    });
    drainStart(night);
    settleFs(night, 5);
    expect(night.next()).toMatchObject({
      kind: "feature_exit",
      color: "green",
      totalCents: 5,
    });
    expect(night.next()).toEqual({ kind: "done" });
  });

  it("shows night_total when green plus one nested red", () => {
    const night = createNight({
      queue: ["green"],
      freeSpins: { spins: 1, retriggerSpins: 1, maxRetriggers: 0 },
      featureBetCents: 10,
    });
    drainStart(night);
    settleFs(night, 5, ["red"]);
    expect(night.next()).toMatchObject({
      kind: "feature_start",
      color: "red",
      nested: true,
    });
    night.settleFeature(9);
    expect(night.next()).toMatchObject({ kind: "feature_exit", color: "red" });
    expect(night.next()).toMatchObject({
      kind: "feature_exit",
      color: "green",
      totalCents: 5,
    });
    expect(night.next()).toEqual({ kind: "night_total", totalCents: 14 });
    expect(night.next()).toEqual({ kind: "done" });
  });
});
