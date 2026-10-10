import { describe, expect, it } from "vitest";
import { loadHotlineConfig } from "../config/loadHotlineConfig.js";
import type { HotlineConfig } from "../config/HotlineConfigSchema.js";
import { evaluatePaylines } from "./evaluatePaylines.js";
import {
  createHotlineGame,
  type HotlineGame,
  type SpinResult,
} from "./HotlineGame.js";
import { createWallet } from "./Wallet.js";

const config = loadHotlineConfig();
const START = config.math.startingBalanceCents;

function cents(display: string): number {
  return Math.round(Number(display) * 100);
}

describe("createHotlineGame", () => {
  it("starts idle with config balance and a 5x4 grid", () => {
    const snap = createHotlineGame({ seed: "a", config }).getSnapshot();
    expect(snap.phase).toBe("idle");
    expect(snap.paylineCount).toBe(40);
    expect(cents(snap.balanceDisplay)).toBe(START);
    expect(snap.grid).toHaveLength(5);
    for (const reel of snap.grid) expect(reel).toHaveLength(4);
    expect(snap.lineWins).toEqual([]);
  });

  it("spin deducts the bet and fills a 5x4 grid of known symbols", () => {
    const game = createHotlineGame({ seed: "a", config });
    const bet = config.math.betStepsCents[0];
    expect(game.spin()).toEqual({ ok: true });
    const snap = game.getSnapshot();
    expect(snap.phase).toBe("settled");
    expect(snap.grid).toHaveLength(5);
    const known = new Set(Object.keys(config.math.symbolWeights[0]));
    for (const reel of snap.grid) {
      expect(reel).toHaveLength(4);
      for (const id of reel) expect(known.has(id)).toBe(true);
    }
    const won = snap.lineWins.reduce((s, w) => s + w.payoutCents, 0);
    expect(cents(snap.balanceDisplay)).toBe(START - bet + won);
    expect(cents(snap.lastWinDisplay)).toBe(won);
  });

  it("settles every spin through evaluatePaylines on the shown grid", () => {
    let balance = START;
    let sawWin = false;
    for (let i = 0; i < 40; i++) {
      const game = createHotlineGame({ seed: `s${i}`, config });
      game.setBetStepIndex(3);
      const bet = config.math.betStepsCents[3];
      expect(game.spin().ok).toBe(true);
      const snap = game.getSnapshot();
      const expected = evaluatePaylines({
        grid: snap.grid,
        paylines: config.math.paylines,
        paytable: config.paytable,
        wildId: config.math.wildSymbolId,
        betCents: bet,
      });
      expect(snap.lineWins).toEqual(expected);
      const won = expected.reduce((s, w) => s + w.payoutCents, 0);
      if (won > 0) sawWin = true;
      balance = START - bet + won;
      expect(cents(snap.balanceDisplay)).toBe(balance);
    }
    expect(sawWin).toBe(true);
  });

  it("replays the same grid sequence for the same seed and bet step", () => {
    const a = createHotlineGame({ seed: "same", config });
    const b = createHotlineGame({ seed: "same", config });
    for (let i = 0; i < 5; i++) {
      a.spin();
      b.spin();
      expect(a.getSnapshot().grid).toEqual(b.getSnapshot().grid);
    }
  });

  it("diverges for a different seed", () => {
    const grids = ["one", "two"].map((seed) => {
      const g = createHotlineGame({ seed, config });
      g.spin();
      return JSON.stringify(g.getSnapshot().grid);
    });
    expect(grids[0]).not.toBe(grids[1]);
  });

  it("rejects a spin the balance cannot cover and leaves the grid alone", () => {
    const poor = {
      ...config,
      math: { ...config.math, startingBalanceCents: 15 },
    };
    const game = createHotlineGame({ seed: "p", config: poor });
    game.setBetStepIndex(1);
    const before = game.getSnapshot();
    const res = game.spin();
    expect(res.ok).toBe(false);
    const after = game.getSnapshot();
    expect(after.grid).toEqual(before.grid);
    expect(after.phase).toBe("idle");
    expect(cents(after.balanceDisplay)).toBe(15);
  });

  it("clamps the bet step index to the config steps", () => {
    const game = createHotlineGame({ seed: "c", config });
    const last = config.math.betStepsCents.length - 1;
    game.setBetStepIndex(-4);
    expect(game.getSnapshot().betStepIndex).toBe(0);
    game.setBetStepIndex(999);
    expect(game.getSnapshot().betStepIndex).toBe(last);
    expect(cents(game.getSnapshot().betDisplay)).toBe(config.math.betStepsCents[last]);
  });
});

describe("bet steps", () => {
  const steps = config.math.betStepsCents;

  it("floors fractional indexes onto a real step", () => {
    const game = createHotlineGame({ seed: "f", config });
    game.setBetStepIndex(2.7);
    expect(game.getSnapshot().betStepIndex).toBe(2);
    expect(cents(game.getSnapshot().betDisplay)).toBe(steps[2]);
  });

  it("ignores a non finite index and keeps the current step", () => {
    const game = createHotlineGame({ seed: "n", config });
    game.setBetStepIndex(4);
    game.setBetStepIndex(Number.NaN);
    expect(game.getSnapshot().betStepIndex).toBe(4);
    game.setBetStepIndex(Number.POSITIVE_INFINITY);
    expect(game.getSnapshot().betStepIndex).toBe(4);
    expect(cents(game.getSnapshot().betDisplay)).toBe(steps[4]);
  });

  it("deducts exactly the selected step on every step", () => {
    steps.forEach((step, i) => {
      const game = createHotlineGame({ seed: "d", config });
      game.setBetStepIndex(i);
      expect(game.spin().ok).toBe(true);
      const snap = game.getSnapshot();
      const won = snap.lineWins.reduce((s, w) => s + w.payoutCents, 0);
      expect(cents(snap.balanceDisplay)).toBe(START - step + won);
    });
  });

  it("wallet refuses stakes that are not config steps", () => {
    const wallet = createWallet(START, steps);
    expect(wallet.placeBet(15)).toEqual({ ok: false, reason: "invalid_step" });
    expect(wallet.placeBet(10.5)).toEqual({ ok: false, reason: "invalid_amount" });
    expect(wallet.placeBet(Number.NaN)).toEqual({ ok: false, reason: "invalid_amount" });
    expect(wallet.getBalanceCents()).toBe(START);
    expect(wallet.placeBet(steps[0])).toEqual({ ok: true });
    expect(wallet.getBalanceCents()).toBe(START - steps[0]);
  });

  it("wallet refuses a step above the balance", () => {
    const wallet = createWallet(50, steps);
    expect(wallet.placeBet(100)).toEqual({ ok: false, reason: "insufficient_balance" });
    expect(wallet.getBalanceCents()).toBe(50);
  });
});

describe("collector outcome on spin", () => {
  function withOdds(
    perSpin: { green: number; red: number; purple: number },
    trigger: { green: number; red: number; purple: number },
  ): HotlineConfig {
    return {
      ...config,
      features: {
        ...config.features,
        tokenOdds: {
          meterTarget: config.features.tokenOdds.meterTarget,
          perSpinChance: perSpin,
          triggerChance: trigger,
        },
      },
    } as HotlineConfig;
  }

  it("attaches collectorOutcome and books meter fills at settle", () => {
    const forced = withOdds(
      { green: 1, red: 1, purple: 1 },
      { green: 1, red: 1, purple: 1 },
    );
    const game = createHotlineGame({ seed: "collect", config: forced });
    expect(game.spin()).toEqual({ ok: true });
    const snap = game.getSnapshot();
    expect(snap.collectorOutcome.spawns).toHaveLength(3);
    expect(snap.collectorOutcome.queue).toEqual(["green", "red", "purple"]);
    expect(snap.meterFills.green.count).toBe(1);
    expect(snap.meterFills.red.count).toBe(1);
    expect(snap.meterFills.purple.count).toBe(1);
    expect(snap.meterFills.green.display).toBe(1);
  });

  it("keeps strip grids stable when only feature chances change", () => {
    // trigger stays 0 so nights never open and both games keep spinning
    const aCfg = withOdds(
      { green: 0, red: 0, purple: 0 },
      { green: 0, red: 0, purple: 0 },
    );
    const bCfg = withOdds(
      { green: 1, red: 1, purple: 1 },
      { green: 0, red: 0, purple: 0 },
    );
    const a = createHotlineGame({ seed: "parity", config: aCfg });
    const b = createHotlineGame({ seed: "parity", config: bCfg });
    let sawMeterGap = false;
    for (let i = 0; i < 10; i++) {
      a.spin();
      b.spin();
      const sa = a.getSnapshot();
      const sb = b.getSnapshot();
      expect(sb.grid).toEqual(sa.grid);
      if (JSON.stringify(sb.meterFills) !== JSON.stringify(sa.meterFills)) {
        sawMeterGap = true;
      }
    }
    expect(sawMeterGap).toBe(true);
  });

  it("accumulates booked fills across spins with soft cap display", () => {
    const cfg = {
      ...withOdds(
        { green: 1, red: 0, purple: 0 },
        { green: 0, red: 0, purple: 0 },
      ),
    };
    cfg.features = {
      ...cfg.features,
      tokenOdds: { ...cfg.features.tokenOdds, meterTarget: 2 },
    };
    const game = createHotlineGame({ seed: "acc", config: cfg });
    game.spin();
    game.spin();
    game.spin();
    const fills = game.getSnapshot().meterFills;
    expect(fills.green.count).toBe(3);
    expect(fills.green.display).toBe(2);
    expect(fills.red.count).toBe(0);
  });
});

describe("green free spins night (BONUS-01)", () => {
  type NightApi = HotlineGame & {
    isNightActive: () => boolean;
    nextNightStep: () => { kind: string; totalCents?: number; color?: string };
    spinFree: () => SpinResult;
    pickLocker: (index: number) => number | null;
  };

  function forcedGreen(retriggerChance = 0): HotlineConfig {
    const base = loadHotlineConfig();
    return {
      ...base,
      features: {
        ...base.features,
        tokenOdds: {
          meterTarget: base.features.tokenOdds.meterTarget,
          perSpinChance: { green: 1, red: 0, purple: 0 },
          triggerChance: { green: 1, red: 0, purple: 0 },
        },
        freeSpins: {
          ...("freeSpins" in base.features
            ? (base.features as { freeSpins: Record<string, unknown> }).freeSpins
            : {
                spins: 24,
                wildWeights: [9, 9, 9, 9],
                retriggerSpins: 6,
                maxRetriggers: 3,
                nested: { red: true, purple: true },
              }),
          retriggerChance,
        },
      },
    } as HotlineConfig;
  }

  it("keeps base grids identical across a night on the same seed", () => {
    const quiet = {
      ...config,
      features: {
        ...config.features,
        tokenOdds: {
          ...config.features.tokenOdds,
          perSpinChance: { green: 0, red: 0, purple: 0 },
          triggerChance: { green: 0, red: 0, purple: 0 },
        },
        freeSpins: { ...config.features.freeSpins, retriggerChance: 0 },
      },
    };
    const noisy = {
      ...quiet,
      features: {
        ...quiet.features,
        tokenOdds: {
          ...quiet.features.tokenOdds,
          perSpinChance: { green: 1, red: 0, purple: 0 },
          triggerChance: { green: 1, red: 0, purple: 0 },
        },
      },
    };
    const a = createHotlineGame({ seed: "stream-iso", config: quiet });
    const b = createHotlineGame({
      seed: "stream-iso",
      config: noisy,
    }) as NightApi;
    expect(a.spin().ok).toBe(true);
    expect(b.spin().ok).toBe(true);
    expect(b.getSnapshot().grid).toEqual(a.getSnapshot().grid);
    expect(b.isNightActive()).toBe(true);
    expect(b.nextNightStep()).toMatchObject({ kind: "feature_start", color: "green" });
    while (b.isNightActive()) {
      const step = b.nextNightStep();
      if (step.kind === "fs_spin") expect(b.spinFree().ok).toBe(true);
      if (step.kind === "done") break;
    }
    expect(a.spin().ok).toBe(true);
    expect(b.spin().ok).toBe(true);
    expect(b.getSnapshot().grid).toEqual(a.getSnapshot().grid);
  });

  it("free spin payouts stay on featureBetCents after mid-night bet change", () => {
    const cfg = forcedGreen(0);
    const game = createHotlineGame({ seed: "bet-cap", config: cfg }) as NightApi;
    game.setBetStepIndex(0);
    expect(game.spin().ok).toBe(true);
    const featureBet = cfg.math.betStepsCents[0];
    expect(game.nextNightStep()).toMatchObject({ kind: "feature_start" });
    expect(game.nextNightStep()).toEqual({ kind: "fs_spin" });
    game.setBetStepIndex(cfg.math.betStepsCents.length - 1);
    expect(game.spinFree().ok).toBe(true);
    const snap = game.getSnapshot();
    const expected = evaluatePaylines({
      grid: snap.grid,
      paylines: cfg.math.paylines,
      paytable: cfg.paytable,
      wildId: cfg.math.wildSymbolId,
      betCents: featureBet,
    });
    expect(snap.lineWins).toEqual(expected);
    const wrongBet = evaluatePaylines({
      grid: snap.grid,
      paylines: cfg.math.paylines,
      paytable: cfg.paytable,
      wildId: cfg.math.wildSymbolId,
      betCents: cfg.math.betStepsCents[cfg.math.betStepsCents.length - 1],
    });
    if (expected.reduce((s, w) => s + w.payoutCents, 0) > 0) {
      expect(snap.lineWins).not.toEqual(wrongBet);
    }
  });

  it("replays identical free spin grids for the same seed and calls", () => {
    const cfg = forcedGreen(0);
    const a = createHotlineGame({ seed: "fs-replay", config: cfg }) as NightApi;
    const b = createHotlineGame({ seed: "fs-replay", config: cfg }) as NightApi;
    for (const g of [a, b]) {
      g.spin();
      g.nextNightStep();
    }
    for (let i = 0; i < 5; i++) {
      expect(a.nextNightStep()).toEqual({ kind: "fs_spin" });
      expect(b.nextNightStep()).toEqual({ kind: "fs_spin" });
      a.spinFree();
      b.spinFree();
      expect(a.getSnapshot().grid).toEqual(b.getSnapshot().grid);
    }
  });

  it("forced green night runs 24 free spins then exits to done", () => {
    const bundled = loadHotlineConfig();
    expect(bundled.features).toHaveProperty("freeSpins");
    expect(bundled.features).toHaveProperty("holdAndWin");
    expect(bundled.features).toHaveProperty("pickEm");

    const cfg = forcedGreen(0);
    const game = createHotlineGame({ seed: "green-night", config: cfg }) as NightApi;
    expect(typeof game.isNightActive).toBe("function");
    expect(typeof game.nextNightStep).toBe("function");
    expect(typeof game.spinFree).toBe("function");

    const startBal = cents(game.getSnapshot().balanceDisplay);
    const bet = cfg.math.betStepsCents[0];
    expect(game.spin()).toEqual({ ok: true });
    const afterBase = game.getSnapshot();
    const baseWin = afterBase.lineWins.reduce((s, w) => s + w.payoutCents, 0);
    expect(game.isNightActive()).toBe(true);
    expect(game.spin()).toEqual({ ok: false, reason: "" });
    expect(cents(game.getSnapshot().balanceDisplay)).toBe(startBal - bet + baseWin);

    expect(game.nextNightStep()).toMatchObject({ kind: "feature_start", color: "green" });

    let fsWins = 0;
    for (let i = 0; i < 24; i++) {
      expect(game.nextNightStep()).toEqual({ kind: "fs_spin" });
      expect(game.spinFree()).toEqual({ ok: true });
      fsWins += game
        .getSnapshot()
        .lineWins.reduce((s, w) => s + w.payoutCents, 0);
    }

    expect(game.spinFree()).toEqual({ ok: false, reason: expect.any(String) });
    const exit = game.nextNightStep();
    expect(exit.kind).toBe("feature_exit");
    if (exit.kind !== "feature_exit") throw new Error("expected feature_exit");
    expect(exit.color).toBe("green");
    expect(exit.totalCents).toBe(fsWins);
    expect(game.nextNightStep()).toEqual({ kind: "done" });
    expect(game.isNightActive()).toBe(false);
    expect(cents(game.getSnapshot().balanceDisplay)).toBe(
      startBal - bet + baseWin + fsWins,
    );
  });

  function forcedPurple(): HotlineConfig {
    return {
      ...config,
      features: {
        ...config.features,
        tokenOdds: {
          meterTarget: config.features.tokenOdds.meterTarget,
          perSpinChance: { green: 0, red: 0, purple: 1 },
          triggerChance: { green: 0, red: 0, purple: 1 },
        },
      },
    };
  }

  it("forced purple night credits wallet once at feature_exit after five picks", () => {
    const cfg = forcedPurple();
    const game = createHotlineGame({
      seed: "purple-pick-night",
      config: cfg,
    }) as NightApi;
    expect(typeof game.pickLocker).toBe("function");

    const startBal = cents(game.getSnapshot().balanceDisplay);
    const bet = cfg.math.betStepsCents[0];
    expect(game.spin()).toEqual({ ok: true });
    const afterBase = game.getSnapshot();
    const baseWin = afterBase.lineWins.reduce((s, w) => s + w.payoutCents, 0);
    expect(game.isNightActive()).toBe(true);

    expect(game.nextNightStep()).toMatchObject({
      kind: "feature_start",
      color: "purple",
    });
    expect(game.nextNightStep()).toEqual({ kind: "wait" });

    const balDuring = cents(game.getSnapshot().balanceDisplay);
    expect(balDuring).toBe(startBal - bet + baseWin);

    for (const idx of [0, 1, 2, 3, 4]) {
      expect(game.pickLocker(idx)).not.toBeNull();
    }
    expect(game.pickLocker(5)).toBeNull();

    const exit = game.nextNightStep();
    expect(exit.kind).toBe("feature_exit");
    if (exit.kind !== "feature_exit") throw new Error("expected feature_exit");
    expect(exit.color).toBe("purple");
    expect(exit.totalCents).toBeGreaterThan(0);
    expect(cents(game.getSnapshot().balanceDisplay)).toBe(
      startBal - bet + baseWin + exit.totalCents,
    );
    expect(game.nextNightStep()).toEqual({ kind: "done" });
    expect(game.isNightActive()).toBe(false);
  });

  function forcedRed(): HotlineConfig {
    return {
      ...config,
      features: {
        ...config.features,
        tokenOdds: {
          meterTarget: config.features.tokenOdds.meterTarget,
          perSpinChance: { green: 0, red: 1, purple: 0 },
          triggerChance: { green: 0, red: 1, purple: 0 },
        },
      },
    };
  }

  it("forced red night drives hold respins then credits wallet once at feature_exit", () => {
    const cfg = forcedRed();
    const game = createHotlineGame({
      seed: "red-hold-night",
      config: cfg,
    }) as NightApi & {
      stepHoldRespin: () => { done: boolean };
      holdSnapshot: () => { done: boolean; cells: unknown[] };
    };
    expect(typeof game.stepHoldRespin).toBe("function");

    const startBal = cents(game.getSnapshot().balanceDisplay);
    const bet = cfg.math.betStepsCents[0];
    expect(game.spin()).toEqual({ ok: true });
    const afterBase = game.getSnapshot();
    const baseWin = afterBase.lineWins.reduce((s, w) => s + w.payoutCents, 0);
    expect(game.isNightActive()).toBe(true);

    expect(game.nextNightStep()).toMatchObject({
      kind: "feature_start",
      color: "red",
    });
    expect(game.nextNightStep()).toEqual({ kind: "wait" });

    const balDuring = cents(game.getSnapshot().balanceDisplay);
    expect(balDuring).toBe(startBal - bet + baseWin);

    let guard = 0;
    while (!game.stepHoldRespin().done && guard < 80) {
      guard += 1;
    }
    expect(guard).toBeLessThan(80);
    const holdSnap = game.holdSnapshot();
    expect(holdSnap).not.toBeNull();
    expect(holdSnap?.done).toBe(true);

    const exit = game.nextNightStep();
    expect(exit.kind).toBe("feature_exit");
    if (exit.kind !== "feature_exit") throw new Error("expected feature_exit");
    expect(exit.color).toBe("red");
    expect(exit.totalCents).toBeGreaterThan(0);
    expect(cents(game.getSnapshot().balanceDisplay)).toBe(
      startBal - bet + baseWin + exit.totalCents,
    );
    expect(game.nextNightStep()).toEqual({ kind: "done" });
    expect(game.isNightActive()).toBe(false);
  });
});

