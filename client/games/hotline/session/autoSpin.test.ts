import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUTO_GAP_MS,
  TURBO_AUTO_GAP_MS,
  autoGapMs,
  shouldAutoSpin,
  shouldStopAuto,
} from "./autoSpin.js";

const ready = {
  autoOn: true,
  idle: true,
  busy: false,
  spinning: false,
  infoOpen: false,
  idleMs: 600,
  gapMs: 600,
};

describe("shouldAutoSpin", () => {
  it("fires once every gate clears and the gap is reached", () => {
    expect(shouldAutoSpin(ready)).toBe(true);
    expect(shouldAutoSpin({ ...ready, idleMs: 5000 })).toBe(true);
  });

  it("waits while auto is off", () => {
    expect(shouldAutoSpin({ ...ready, autoOn: false })).toBe(false);
  });

  it("waits while the session is not idle", () => {
    expect(shouldAutoSpin({ ...ready, idle: false })).toBe(false);
  });

  it("waits while busy, spinning or the info sheet is open", () => {
    expect(shouldAutoSpin({ ...ready, busy: true })).toBe(false);
    expect(shouldAutoSpin({ ...ready, spinning: true })).toBe(false);
    expect(shouldAutoSpin({ ...ready, infoOpen: true })).toBe(false);
  });

  it("waits until the idle gap is reached", () => {
    expect(shouldAutoSpin({ ...ready, idleMs: 599 })).toBe(false);
    expect(shouldAutoSpin({ ...ready, idleMs: 0 })).toBe(false);
  });

  it("never fires on a bad idle time", () => {
    expect(shouldAutoSpin({ ...ready, idleMs: Number.NaN })).toBe(false);
  });
});

describe("shouldStopAuto", () => {
  it("keeps going on ok and on silent refusals", () => {
    expect(shouldStopAuto({ ok: true })).toBe(false);
    expect(shouldStopAuto({ ok: false, reason: "" })).toBe(false);
  });

  it("stops on a refusal with a reason", () => {
    expect(shouldStopAuto({ ok: false, reason: "insufficient_balance" })).toBe(
      true,
    );
  });
});

describe("autoGapMs", () => {
  it("is shorter with turbo and never below the safety floor", () => {
    expect(autoGapMs(true)).toBe(TURBO_AUTO_GAP_MS);
    expect(autoGapMs(false)).toBe(AUTO_GAP_MS);
    expect(autoGapMs(true)).toBeLessThan(autoGapMs(false));
    expect(autoGapMs(true)).toBeGreaterThanOrEqual(200);
  });
});

describe("autoSpin module", () => {
  it("has no pixi and no document", () => {
    const src = readFileSync(join(import.meta.dirname, "autoSpin.ts"), "utf8");
    expect(src).not.toMatch(/from\s+["']pixi\.js["']/);
    expect(src).not.toMatch(/\bdocument\b/);
  });
});
