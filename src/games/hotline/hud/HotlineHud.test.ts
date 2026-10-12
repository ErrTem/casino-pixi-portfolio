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
  className = "";
  children: FakeEl[] = [];
  private listeners = new Map<string, Set<() => void>>();
  addEventListener(type: string, fn: () => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
  }
  removeEventListener(type: string, fn: () => void): void {
    this.listeners.get(type)?.delete(fn);
  }
  setAttribute(): void {}
  appendChild(child: FakeEl): FakeEl {
    this.children.push(child);
    return child;
  }
  replaceChildren(...nodes: FakeEl[]): void {
    this.children = [...nodes];
    if (nodes.length === 0) this.textContent = "";
  }
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
    "[data-field=combo]",
    "[data-field=feature]",
    "[data-action=spin]",
    "[data-action=bet-dec]",
    "[data-action=bet-inc]",
    "[data-action=gamble]",
    "[data-action=info]",
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

  it("counts the last win up when a tween time is set (D-15)", () => {
    const config = loadHotlineConfig();
    const game = createHotlineGame({ seed: "hud", config });
    const { root, els } = makeRoot();
    let clock = 0;
    const hud = mountHotlineHud(root, game, {
      betStepCount: config.math.betStepsCents.length,
      lastWinTweenMs: 1000,
      now: () => clock,
    });
    let won = false;
    for (let i = 0; i < 400 && !won; i += 1) {
      game.spin();
      won = Number.parseFloat(game.getSnapshot().lastWinDisplay) > 0;
    }
    expect(won).toBe(true);
    const target = game.getSnapshot().lastWinDisplay;
    clock = 5000;
    hud.render(game.getSnapshot());
    expect(els["[data-field=last-win]"].textContent).toBe("0.00");
    clock = 5400;
    hud.render(game.getSnapshot());
    const mid = Number.parseFloat(els["[data-field=last-win]"].textContent);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThanOrEqual(Number.parseFloat(target));
    clock = 6100;
    hud.render(game.getSnapshot());
    expect(els["[data-field=last-win]"].textContent).toBe(target);
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

describe("HotlineHud busy lock and combo strip (D-10, D-14)", () => {
  it("setBusy disables spin and bet steppers", () => {
    const { els, hud } = setup();
    expect(typeof hud.setBusy).toBe("function");
    expect(els["[data-action=spin]"].disabled).toBe(false);
    hud.setBusy(true);
    expect(els["[data-action=spin]"].disabled).toBe(true);
    expect(els["[data-action=bet-dec]"].disabled).toBe(true);
    expect(els["[data-action=bet-inc]"].disabled).toBe(true);
    hud.setBusy(false);
    expect(els["[data-action=spin]"].disabled).toBe(false);
  });

  it("setCombo writes combo strip via textContent only", () => {
    const { els, hud } = setup();
    expect(typeof hud.setCombo).toBe("function");
    expect(els["[data-field=combo]"].textContent).toBe("");
    hud.setCombo("COMBO: Green → Red");
    expect(els["[data-field=combo]"].textContent).toBe("COMBO: Green → Red");
    hud.setCombo("");
    expect(els["[data-field=combo]"].textContent).toBe("");
  });

  it("setComboPath builds span steps with active and done classes (D-18)", () => {
    const { els, hud } = setup();
    expect(typeof hud.setComboPath).toBe("function");
    const g = globalThis as { document?: { createElement: (tag: string) => FakeEl } };
    const prev = g.document;
    g.document = {
      createElement: () => new FakeEl(),
    };
    try {
      const combo = els["[data-field=combo]"];
      hud.setComboPath([
        { label: "Green", state: "done" },
        { label: "Red", state: "active" },
        { label: "Purple", state: "pending" },
      ]);
      const steps = combo.children.filter((c) =>
        c.className.includes("hotline-combo-step"),
      );
      expect(steps).toHaveLength(3);
      expect(steps[0].textContent).toBe("Green");
      expect(steps[0].className).toMatch(/\bdone\b/);
      expect(steps[1].textContent).toBe("Red");
      expect(steps[1].className).toMatch(/\bactive\b/);
      expect(steps[2].textContent).toBe("Purple");
      expect(steps[2].className).not.toMatch(/\bactive\b/);
      expect(steps[2].className).not.toMatch(/\bdone\b/);
      hud.setComboPath([]);
      expect(combo.children).toHaveLength(0);
    } finally {
      if (prev) g.document = prev;
      else delete g.document;
    }
  });

  it("hud source uses createElement and textContent for setComboPath", () => {
    const src = readFileSync(join(import.meta.dirname, "HotlineHud.ts"), "utf8");
    expect(src).toMatch(/setComboPath/);
    expect(src).toMatch(/createElement\s*\(\s*["']span["']\s*\)/);
    expect(src).toMatch(/hotline-combo-step/);
    expect(src).not.toMatch(/\.innerHTML\b/);
  });
});

describe("HotlineHud free spins feature line (D-02)", () => {
  it("setFeatureLine writes [data-field=feature] via textContent", () => {
    const { els, hud } = setup();
    expect(typeof hud.setFeatureLine).toBe("function");
    expect(els["[data-field=feature]"].textContent).toBe("");
    hud.setFeatureLine("FREE SPINS 12 LEFT  WIN 18.40");
    expect(els["[data-field=feature]"].textContent).toBe(
      "FREE SPINS 12 LEFT  WIN 18.40",
    );
    hud.setFeatureLine("");
    expect(els["[data-field=feature]"].textContent).toBe("");
  });

  it("setFeatureLine ignores calls after dispose", () => {
    const { els, hud } = setup();
    expect(typeof hud.setFeatureLine).toBe("function");
    hud.setFeatureLine("FREE SPINS 1 LEFT  WIN 0.00");
    hud.dispose();
    hud.setFeatureLine("FREE SPINS 0 LEFT  WIN 1.00");
    expect(els["[data-field=feature]"].textContent).toBe(
      "FREE SPINS 1 LEFT  WIN 0.00",
    );
  });

  it("throws when [data-field=feature] is missing", () => {
    const config = loadHotlineConfig();
    const game = createHotlineGame({ seed: "hud-feature", config });
    const names = [
      "[data-field=balance]",
      "[data-field=last-win]",
      "[data-field=bet]",
      "[data-field=lines]",
      "[data-field=status]",
      "[data-field=combo]",
      "[data-action=spin]",
      "[data-action=bet-dec]",
      "[data-action=bet-inc]",
    ];
    const els: Record<string, FakeEl> = {};
    for (const n of names) els[n] = new FakeEl();
    const root = {
      querySelector: (sel: string) => els[sel] ?? null,
    } as unknown as Element;
    expect(() =>
      mountHotlineHud(root, game, {
        betStepCount: config.math.betStepsCents.length,
      }),
    ).toThrow("hotline hud: [data-field=feature] missing");
  });
});


describe("HotlineHud gamble control (GAMBLE-01, D-01)", () => {
  it("starts with gamble disabled and enables it on request", () => {
    const { els, hud } = setup();
    expect(typeof hud.setGambleEnabled).toBe("function");
    expect(els["[data-action=gamble]"].disabled).toBe(true);
    hud.setGambleEnabled(true);
    expect(els["[data-action=gamble]"].disabled).toBe(false);
    hud.setGambleEnabled(false);
    expect(els["[data-action=gamble]"].disabled).toBe(true);
  });

  it("busy locks gamble even when it is enabled", () => {
    const { els, hud } = setup();
    expect(typeof hud.setGambleEnabled).toBe("function");
    hud.setGambleEnabled(true);
    hud.setBusy(true);
    expect(els["[data-action=gamble]"].disabled).toBe(true);
    hud.setBusy(false);
    expect(els["[data-action=gamble]"].disabled).toBe(false);
  });

  it("gamble click calls onGamble and ignores clicks after dispose", () => {
    const config = loadHotlineConfig();
    const game = createHotlineGame({ seed: "hud-gamble", config });
    const { root, els } = makeRoot();
    let calls = 0;
    const hud = mountHotlineHud(root, game, {
      betStepCount: config.math.betStepsCents.length,
      onGamble: () => {
        calls += 1;
      },
    });
    hud.render(game.getSnapshot());
    els["[data-action=gamble]"].click();
    expect(calls).toBe(0);
    hud.setGambleEnabled(true);
    els["[data-action=gamble]"].click();
    expect(calls).toBe(1);
    hud.dispose();
    expect(els["[data-action=gamble]"].count()).toBe(0);
  });
});
describe("HotlineHud info control (BASE-04, D-09, D-12)", () => {
  it("info click calls onInfo and ignores clicks after dispose", () => {
    const config = loadHotlineConfig();
    const game = createHotlineGame({ seed: "hud-info", config });
    const { root, els } = makeRoot();
    let calls = 0;
    const hud = mountHotlineHud(root, game, {
      betStepCount: config.math.betStepsCents.length,
      onInfo: () => {
        calls += 1;
      },
    });
    hud.render(game.getSnapshot());
    els["[data-action=info]"].click();
    expect(calls).toBe(1);
    hud.dispose();
    expect(els["[data-action=info]"].count()).toBe(0);
    els["[data-action=info]"].click();
    expect(calls).toBe(1);
  });

  it("busy locks spin gamble and bet but leaves info enabled", () => {
    const config = loadHotlineConfig();
    const game = createHotlineGame({ seed: "hud-info-busy", config });
    const { root, els } = makeRoot();
    let calls = 0;
    const hud = mountHotlineHud(root, game, {
      betStepCount: config.math.betStepsCents.length,
      onInfo: () => {
        calls += 1;
      },
    });
    hud.render(game.getSnapshot());
    hud.setGambleEnabled(true);
    hud.setBusy(true);
    expect(els["[data-action=spin]"].disabled).toBe(true);
    expect(els["[data-action=gamble]"].disabled).toBe(true);
    expect(els["[data-action=bet-dec]"].disabled).toBe(true);
    expect(els["[data-action=bet-inc]"].disabled).toBe(true);
    expect(els["[data-action=info]"].disabled).toBe(false);
    els["[data-action=info]"].click();
    expect(calls).toBe(1);
  });

  it("hud source never disables info", () => {
    const src = readFileSync(join(import.meta.dirname, "HotlineHud.ts"), "utf8");
    expect(src).toMatch(/data-action=info/);
    expect(src).not.toMatch(/infoBtn\.disabled\s*=/);
  });
});