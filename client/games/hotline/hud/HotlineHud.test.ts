import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadHotlineConfig } from "../../../../math/hotline/config/loadHotlineConfig.js";
import { createHotlineGame } from "../../../../math/hotline/index.js";
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
  attrs = new Map<string, string>();
  setAttribute(name: string, value: string): void {
    this.attrs.set(name, value);
  }
  getAttribute(name: string): string | null {
    return this.attrs.get(name) ?? null;
  }
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
    "[data-field=status]",
    "[data-field=combo]",
    "[data-field=feature]",
    "[data-action=spin]",
    "[data-action=bet-dec]",
    "[data-action=bet-inc]",
    "[data-action=gamble]",
    "[data-action=info]",
    "[data-action=turbo]",
    "[data-action=auto]",
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

  it("spin updates balance and last win from the snapshot", () => {
    const { game, els } = setup();
    els["[data-action=spin]"].click();
    const snap = game.getSnapshot();
    expect(snap.phase).toBe("settled");
    expect(els["[data-field=balance]"].textContent).toBe(snap.balanceDisplay);
    const win = Number.parseFloat(snap.lastWinDisplay);
    if (win > 0) {
      expect(els["[data-field=last-win]"].textContent).toBe(snap.lastWinDisplay);
    } else {
      expect(els["[data-field=last-win]"].textContent).toBe("0.00");
    }
  });

  it("starts last win at 0.00 and keeps it through idle and blank settles", () => {
    const { game, els, hud } = setup();
    expect(els["[data-field=last-win]"].textContent).toBe("0.00");
    hud.render({ ...game.getSnapshot(), phase: "idle" });
    expect(els["[data-field=last-win]"].textContent).toBe("0.00");

    let won = "";
    for (let i = 0; i < 400 && !won; i += 1) {
      game.spin();
      const snap = game.getSnapshot();
      hud.render(snap);
      if (Number.parseFloat(snap.lastWinDisplay) > 0) won = snap.lastWinDisplay;
    }
    expect(won).not.toBe("");
    expect(els["[data-field=last-win]"].textContent).toBe(won);

    // blank settle and mid-spin chrome must not wipe the sticky amount
    hud.render({
      ...game.getSnapshot(),
      phase: "settled",
      lastWinDisplay: "0.00",
    });
    expect(els["[data-field=last-win]"].textContent).toBe(won);
    hud.render({ ...game.getSnapshot(), phase: "idle", lastWinDisplay: "0.00" });
    expect(els["[data-field=last-win]"].textContent).toBe(won);
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
describe("HotlineHud turbo and auto controls (quick 261012-jg6)", () => {
  function mount(extra: Record<string, unknown> = {}) {
    const config = loadHotlineConfig();
    const game = createHotlineGame({ seed: "hud-modes", config });
    const { root, els } = makeRoot();
    const hud = mountHotlineHud(root, game, {
      betStepCount: config.math.betStepsCents.length,
      ...extra,
    });
    hud.render(game.getSnapshot());
    return { game, els, hud };
  }

  it("turbo click flips aria-pressed and reports on then off", () => {
    const seen: boolean[] = [];
    const { els } = mount({ onTurboChange: (on: boolean) => seen.push(on) });
    const btn = els["[data-action=turbo]"];
    btn.click();
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    btn.click();
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    expect(seen).toEqual([true, false]);
  });

  it("auto click reports on and setAuto resets without a callback", () => {
    const seen: boolean[] = [];
    const { els, hud } = mount({ onAutoChange: (on: boolean) => seen.push(on) });
    const btn = els["[data-action=auto]"];
    btn.click();
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    expect(seen).toEqual([true]);
    hud.setAuto(false);
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    expect(seen).toEqual([true]);
    btn.click();
    expect(seen).toEqual([true, true]);
  });

  it("setBusy never locks turbo or auto", () => {
    const { els, hud } = mount();
    hud.setBusy(true);
    expect(els["[data-action=turbo]"].disabled).toBe(false);
    expect(els["[data-action=auto]"].disabled).toBe(false);
  });

  it("requestSpin runs the spin path and returns the result", () => {
    const { game, els, hud } = mount();
    const result = hud.requestSpin();
    expect(result.ok).toBe(true);
    expect(game.getSnapshot().phase).toBe("settled");
    expect(els["[data-field=status]"].textContent).toBe("");
    expect(els["[data-field=balance]"].textContent).toBe(
      game.getSnapshot().balanceDisplay,
    );
  });

  it("requestSpin writes the refusal reason to status", () => {
    const config = loadHotlineConfig();
    const game = createHotlineGame({ seed: "hud-refuse", config });
    const refusing = {
      ...game,
      spin: () => ({ ok: false as const, reason: "insufficient_balance" }),
    };
    const { root, els } = makeRoot();
    const hud = mountHotlineHud(root, refusing, {
      betStepCount: config.math.betStepsCents.length,
    });
    const result = hud.requestSpin();
    expect(result).toEqual({ ok: false, reason: "insufficient_balance" });
    expect(els["[data-field=status]"].textContent).toBe("insufficient_balance");
  });

  it("requestSpin does nothing after dispose", () => {
    const { hud } = mount();
    hud.dispose();
    expect(hud.requestSpin()).toEqual({ ok: false, reason: "" });
  });

  it("dispose removes the turbo and auto listeners", () => {
    const { els, hud } = mount();
    hud.dispose();
    expect(els["[data-action=turbo]"].count()).toBe(0);
    expect(els["[data-action=auto]"].count()).toBe(0);
  });

  it("hud source never disables turbo or auto", () => {
    const src = readFileSync(join(import.meta.dirname, "HotlineHud.ts"), "utf8");
    expect(src).toMatch(/data-action=turbo/);
    expect(src).toMatch(/data-action=auto/);
    expect(src).not.toMatch(/(turboBtn|autoBtn)\.disabled/);
  });
});

describe("HotlineHud Space/Enter spin and last-win total (quick 261014-qjx)", () => {
  type KeyFn = (e: {
    key: string;
    repeat: boolean;
    target: unknown;
    preventDefault: () => void;
  }) => void;

  function installWindow(): {
    dispatch: (partial: {
      key: string;
      repeat?: boolean;
      target?: unknown;
    }) => { prevented: boolean };
    keydownCount: () => number;
  } {
    const listeners = new Set<KeyFn>();
    const win = {
      addEventListener(type: string, fn: KeyFn): void {
        if (type === "keydown") listeners.add(fn);
      },
      removeEventListener(type: string, fn: KeyFn): void {
        if (type === "keydown") listeners.delete(fn);
      },
    };
    const g = globalThis as { window?: typeof win };
    g.window = win;
    return {
      dispatch(partial) {
        let prevented = false;
        const e = {
          key: partial.key,
          repeat: partial.repeat ?? false,
          target: partial.target ?? null,
          preventDefault: () => {
            prevented = true;
          },
        };
        for (const fn of [...listeners]) fn(e);
        return { prevented };
      },
      keydownCount: () => listeners.size,
    };
  }

  function mountWithWindow(extra: Record<string, unknown> = {}) {
    const win = installWindow();
    const config = loadHotlineConfig();
    const game = createHotlineGame({ seed: "hud-keys", config });
    const { root, els } = makeRoot();
    const hud = mountHotlineHud(root, game, {
      betStepCount: config.math.betStepsCents.length,
      ...extra,
    });
    hud.render(game.getSnapshot());
    return { game, els, hud, win, config };
  }

  it("Space and Enter call the spin path when enabled", () => {
    const { game, els, hud, win } = mountWithWindow();
    const before = game.getSnapshot().balanceDisplay;
    const space = win.dispatch({ key: " " });
    expect(space.prevented).toBe(true);
    expect(game.getSnapshot().phase).toBe("settled");
    expect(els["[data-field=balance]"].textContent).not.toBe(before);

    // settle then idle chrome, then Enter spins again
    hud.render({ ...game.getSnapshot(), phase: "idle" });
    const mid = game.getSnapshot().balanceDisplay;
    const enter = win.dispatch({ key: "Enter" });
    expect(enter.prevented).toBe(true);
    expect(els["[data-field=balance]"].textContent).not.toBe(mid);
    hud.dispose();
    delete (globalThis as { window?: unknown }).window;
  });

  it("ignores repeat, editable targets, busy spin, and disposed hud", () => {
    const { game, els, hud, win } = mountWithWindow();
    expect(win.keydownCount()).toBe(1);
    const bal0 = game.getSnapshot().balanceDisplay;

    expect(win.dispatch({ key: " ", repeat: true }).prevented).toBe(false);
    expect(game.getSnapshot().balanceDisplay).toBe(bal0);

    const input = {
      tagName: "INPUT",
      isContentEditable: false,
      readOnly: false,
      disabled: false,
    };
    expect(
      win.dispatch({ key: "Enter", target: input }).prevented,
    ).toBe(false);
    expect(game.getSnapshot().balanceDisplay).toBe(bal0);

    hud.setBusy(true);
    expect(els["[data-action=spin]"].disabled).toBe(true);
    expect(win.dispatch({ key: " " }).prevented).toBe(false);
    expect(game.getSnapshot().balanceDisplay).toBe(bal0);
    hud.setBusy(false);

    hud.dispose();
    expect(win.keydownCount()).toBe(0);
    expect(win.dispatch({ key: " " }).prevented).toBe(false);
    expect(game.getSnapshot().balanceDisplay).toBe(bal0);
    delete (globalThis as { window?: unknown }).window;
  });

  it("interrupted last-win tween then a new settle refreshes the total", () => {
    const config = loadHotlineConfig();
    const game = createHotlineGame({ seed: "hud", config });
    const { root, els } = makeRoot();
    let clock = 0;
    const hud = mountHotlineHud(root, game, {
      betStepCount: config.math.betStepsCents.length,
      lastWinTweenMs: 1000,
      now: () => clock,
    });
    let first = "";
    for (let i = 0; i < 400 && !first; i += 1) {
      game.spin();
      const snap = game.getSnapshot();
      if (Number.parseFloat(snap.lastWinDisplay) > 0) {
        first = snap.lastWinDisplay;
        clock = 1000;
        hud.render(snap);
      }
    }
    expect(first).not.toBe("");
    // mid count up then session forces idle while reels spin
    clock = 1300;
    hud.render(game.getSnapshot());
    const mid = Number.parseFloat(els["[data-field=last-win]"].textContent);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(Number.parseFloat(first));
    hud.render({
      ...game.getSnapshot(),
      phase: "idle",
      lastWinDisplay: "0.00",
    });
    // sticky must keep the settle total, not the mid tween or blank
    expect(els["[data-field=last-win]"].textContent).toBe(first);

    let second = "";
    for (let i = 0; i < 400 && !second; i += 1) {
      game.spin();
      const snap = game.getSnapshot();
      if (
        Number.parseFloat(snap.lastWinDisplay) > 0 &&
        snap.lastWinDisplay !== first
      ) {
        second = snap.lastWinDisplay;
        clock = 5000;
        hud.render(snap);
      }
    }
    expect(second).not.toBe("");
    clock = 5500;
    hud.render(game.getSnapshot());
    expect(
      Number.parseFloat(els["[data-field=last-win]"].textContent),
    ).toBeGreaterThan(0);
    clock = 6200;
    hud.render(game.getSnapshot());
    expect(els["[data-field=last-win]"].textContent).toBe(second);
    hud.dispose();
  });

  it("last-win shows night.fs cumulative totalCents while fs is active", () => {
    const { game, els, hud } = setup();
    const base = game.getSnapshot();
    hud.render({
      ...base,
      phase: "settled",
      lastWinDisplay: "1.25",
      night: {
        path: [{ color: "green", nested: false, state: "active" }],
        activeIndex: 0,
        fs: {
          spinsLeft: 8,
          spinsDone: 2,
          totalSpins: 10,
          retriggers: 0,
          totalCents: 1840,
        },
        totalCents: 1840,
        featureBetCents: 100,
      },
    });
    expect(els["[data-field=last-win]"].textContent).toBe("18.40");
    hud.dispose();
  });
});

describe("HotlineHud win fly to balance then pulse (quick 261014-qjx)", () => {
  class DomEl extends FakeEl {
    style: Record<string, string> = {};
    classList = {
      tokens: new Set<string>(),
      add: (c: string) => {
        this.classList.tokens.add(c);
        this.className = [...this.classList.tokens].join(" ");
      },
      remove: (c: string) => {
        this.classList.tokens.delete(c);
        this.className = [...this.classList.tokens].join(" ");
      },
      contains: (c: string) => this.classList.tokens.has(c),
    };
    parent: DomEl | null = null;
    rect = { left: 0, top: 0, width: 40, height: 20, right: 40, bottom: 20 };
    getBoundingClientRect() {
      return this.rect;
    }
    closest(sel: string): DomEl | null {
      if (sel === ".top-chrome__balance") {
        let n: DomEl | null = this;
        while (n) {
          if (n.classList.contains("top-chrome__balance")) return n;
          n = n.parent;
        }
      }
      return null;
    }
    remove(): void {
      const body = (globalThis as unknown as { document?: { body: DomEl } })
        .document?.body;
      if (!body) return;
      body.children = body.children.filter((c) => c !== this);
    }
  }

  function installDom() {
    const body = new DomEl();
    const created: DomEl[] = [];
    const doc = {
      body,
      createElement: (_tag: string) => {
        const el = new DomEl();
        created.push(el);
        return el;
      },
    };
    const g = globalThis as unknown as {
      document?: typeof doc;
      requestAnimationFrame?: (cb: FrameRequestCallback) => number;
      cancelAnimationFrame?: (id: number) => void;
    };
    const prevDoc = g.document;
    const prevRaf = g.requestAnimationFrame;
    const prevCaf = g.cancelAnimationFrame;
    g.document = doc;
    // fly path uses timeouts; raf optional
    g.requestAnimationFrame = (cb) =>
      setTimeout(() => cb(performance.now()), 0) as unknown as number;
    g.cancelAnimationFrame = (id) => clearTimeout(id);
    return {
      created,
      body,
      restore() {
        if (prevDoc) g.document = prevDoc;
        else delete g.document;
        if (prevRaf) g.requestAnimationFrame = prevRaf;
        else delete g.requestAnimationFrame;
        if (prevCaf) g.cancelAnimationFrame = prevCaf;
        else delete g.cancelAnimationFrame;
      },
    };
  }

  function makeFlyRoot() {
    const names = [
      "[data-field=balance]",
      "[data-field=last-win]",
      "[data-field=bet]",
      "[data-field=status]",
      "[data-field=combo]",
      "[data-field=feature]",
      "[data-action=spin]",
      "[data-action=bet-dec]",
      "[data-action=bet-inc]",
      "[data-action=gamble]",
      "[data-action=info]",
      "[data-action=turbo]",
      "[data-action=auto]",
    ];
    const els: Record<string, DomEl> = {};
    for (const n of names) els[n] = new DomEl();
    const host = new DomEl();
    host.classList.add("top-chrome__balance");
    els["[data-field=balance]"].parent = host;
    host.appendChild(els["[data-field=balance]"]);
    els["[data-field=last-win]"].rect = {
      left: 100,
      top: 80,
      width: 48,
      height: 16,
      right: 148,
      bottom: 96,
    };
    host.rect = {
      left: 20,
      top: 10,
      width: 120,
      height: 36,
      right: 140,
      bottom: 46,
    };
    const root = {
      querySelector: (sel: string) => els[sel] ?? null,
    } as unknown as Element;
    return { root, els, host };
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it("flies a win chip then updates balance and pulses the chrome", () => {
    vi.useFakeTimers();
    const dom = installDom();
    const config = loadHotlineConfig();
    const game = createHotlineGame({ seed: "hud-fly", config });
    const { root, els, host } = makeFlyRoot();
    const hud = mountHotlineHud(root, game, {
      betStepCount: config.math.betStepsCents.length,
    });
    hud.render({
      ...game.getSnapshot(),
      phase: "idle",
      balanceDisplay: "100.00",
      lastWinDisplay: "0.00",
    });
    expect(els["[data-field=balance]"].textContent).toBe("100.00");

    hud.render({
      ...game.getSnapshot(),
      phase: "settled",
      balanceDisplay: "105.50",
      lastWinDisplay: "5.50",
    });
    // balance held until the chip lands
    expect(els["[data-field=balance]"].textContent).toBe("100.00");
    const chip = dom.created.find((c) =>
      c.className.includes("hotline-win-fly"),
    );
    expect(chip).toBeTruthy();
    expect(chip!.textContent).toBe("5.50");

    vi.advanceTimersByTime(600);
    expect(els["[data-field=balance]"].textContent).toBe("105.50");
    expect(host.classList.contains("top-chrome__balance--pulse")).toBe(true);
    expect(
      dom.body.children.some((c) => c.className.includes("hotline-win-fly")),
    ).toBe(false);

    vi.advanceTimersByTime(700);
    expect(host.classList.contains("top-chrome__balance--pulse")).toBe(false);
    hud.dispose();
    dom.restore();
  });

  it("skips fly on blank settle and clears in-flight chip on dispose", () => {
    vi.useFakeTimers();
    const dom = installDom();
    const config = loadHotlineConfig();
    const game = createHotlineGame({ seed: "hud-fly-skip", config });
    const { root, els, host } = makeFlyRoot();
    const hud = mountHotlineHud(root, game, {
      betStepCount: config.math.betStepsCents.length,
    });
    hud.render({
      ...game.getSnapshot(),
      phase: "settled",
      balanceDisplay: "90.00",
      lastWinDisplay: "0.00",
    });
    expect(els["[data-field=balance]"].textContent).toBe("90.00");
    expect(dom.created.some((c) => c.className.includes("hotline-win-fly"))).toBe(
      false,
    );

    hud.render({
      ...game.getSnapshot(),
      phase: "settled",
      balanceDisplay: "95.00",
      lastWinDisplay: "5.00",
    });
    expect(els["[data-field=balance]"].textContent).toBe("90.00");
    hud.dispose();
    expect(
      dom.body.children.some((c) => c.className.includes("hotline-win-fly")),
    ).toBe(false);
    expect(host.classList.contains("top-chrome__balance--pulse")).toBe(false);
    dom.restore();
  });

  it("hud css defines balance pulse and flying chip under hotline-screen", () => {
    const css = readFileSync(
      join(import.meta.dirname, "../../../styles/hud.css"),
      "utf8",
    );
    expect(css).toMatch(/@keyframes\s+hotline-balance-pulse/);
    expect(css).toMatch(/top-chrome__balance--pulse/);
    expect(css).toMatch(/\.hotline-win-fly/);
  });
});
