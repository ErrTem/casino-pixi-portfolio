import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadHotlineConfig } from "../config/loadHotlineConfig.js";
import { createHotlineGame } from "../logic/index.js";
import { mountHotlineHud } from "./HotlineHud.js";

// minimal element double, enough for the hud binder in a node environment
class FakeEl {
  textContent = "";
  disabled = false;
  private listeners = new Map<string, Set<() => void>>();
  addEventListener(type: string, fn: () => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
  }
  removeEventListener(type: string, fn: () => void): void {
    this.listeners.get(type)?.delete(fn);
  }
  setAttribute(): void {}
  click(): void {
    for (const fn of this.listeners.get("click") ?? []) fn();
  }
  count(): number {
    return this.listeners.get("click")?.size ?? 0;
  }
}

function makeRoot(): { root: Element; els: Record<string, FakeEl> } {
  const names = [
    "[data-field=balance]",
    "[data-field=last-win]",
    "[data-field=bet]",
    "[data-field=lines]",
    "[data-field=status]",
    "[data-action=spin]",
    "[data-action=bet-dec]",
    "[data-action=bet-inc]",
  ];
  const els: Record<string, FakeEl> = {};
  for (const n of names) els[n] = new FakeEl();
  const root = {
    querySelector: (sel: string) => els[sel] ?? null,
  } as unknown as Element;
  return { root, els };
}

function setup() {
  const config = loadHotlineConfig();
  const game = createHotlineGame({ seed: "hud", config });
  const { root, els } = makeRoot();
  const steps = config.math.betStepsCents;
  const hud = mountHotlineHud(root, game, { betStepCount: steps.length });
  hud.render(game.getSnapshot());
  return { game, els, hud, steps };
}

describe("HotlineHud bet steps (D-13)", () => {
  it("walks only the config steps with bet inc and dec", () => {
    const { game, els, steps } = setup();
    const seen: string[] = [els["[data-field=bet]"].textContent];
    for (let i = 0; i < steps.length + 3; i += 1) {
      els["[data-action=bet-inc]"].click();
      seen.push(els["[data-field=bet]"].textContent);
    }
    const allowed = new Set(steps.map((c) => (c / 100).toFixed(2)));
    for (const text of seen) expect(allowed.has(text)).toBe(true);
    expect(game.getSnapshot().betStepIndex).toBe(steps.length - 1);
    expect(els["[data-action=bet-inc]"].disabled).toBe(true);

    for (let i = 0; i < steps.length + 3; i += 1) {
      els["[data-action=bet-dec]"].click();
    }
    expect(game.getSnapshot().betStepIndex).toBe(0);
    expect(els["[data-action=bet-dec]"].disabled).toBe(true);
  });

  it("shows the selected step as the bet readout", () => {
    const { game, els } = setup();
    els["[data-action=bet-inc]"].click();
    expect(els["[data-field=bet]"].textContent).toBe(
      game.getSnapshot().betDisplay,
    );
  });

  it("spin updates balance from the snapshot and keeps 40 lines", () => {
    const { game, els } = setup();
    els["[data-action=spin]"].click();
    const snap = game.getSnapshot();
    expect(snap.phase).toBe("settled");
    expect(els["[data-field=balance]"].textContent).toBe(snap.balanceDisplay);
    expect(els["[data-field=last-win]"].textContent).toBe(snap.lastWinDisplay);
    expect(els["[data-field=lines]"].textContent).toBe("40 lines");
  });

  it("dispose removes listeners", () => {
    const { els, hud } = setup();
    hud.dispose();
    expect(els["[data-action=spin]"].count()).toBe(0);
    expect(els["[data-action=bet-inc]"].count()).toBe(0);
  });

  it("throws loud when a required node is missing", () => {
    const { game } = { game: setup().game };
    const empty = { querySelector: () => null } as unknown as Element;
    expect(() => mountHotlineHud(empty, game, { betStepCount: 7 })).toThrow(
      /hotline hud: .* missing/,
    );
  });

  it("hud source writes text only and has no free bet input", () => {
    const src = readFileSync(join(import.meta.dirname, "HotlineHud.ts"), "utf8");
    expect(src).not.toMatch(/\.innerHTML\b/);
    expect(src).not.toMatch(/bet-input/);
    expect(src).toMatch(/setBetStepIndex\(/);
  });
});
