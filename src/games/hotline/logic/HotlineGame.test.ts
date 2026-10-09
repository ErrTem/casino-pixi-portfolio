import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadHotlineConfig } from "../config/loadHotlineConfig.js";
import { evaluatePaylines } from "./evaluatePaylines.js";
import { createHotlineGame } from "./HotlineGame.js";
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

describe("feature tables stay out of base settlement", () => {
  const dir = import.meta.dirname;
  const files = ["HotlineGame.ts", "evaluatePaylines.ts", "SpinEngine.ts", "Wallet.ts"];

  function strip(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  }

  it("no logic source touches config.features or its tables", () => {
    for (const name of files) {
      const code = strip(readFileSync(join(dir, name), "utf8"));
      expect(code, name).not.toMatch(/\bfeatures\b/);
      expect(code, name).not.toMatch(/\b(tokenOdds|bonusPrizes|jackpotMultipliers)\b/);
    }
  });

  it("spin outcome does not change when feature tables change", () => {
    const altered = {
      ...config,
      features: {
        ...config.features,
        tokenOdds: {
          meterTarget: 1,
          perSpinChance: { pink: 1, cyan: 1, yellow: 1 },
        },
      },
    };
    const a = createHotlineGame({ seed: "ft", config });
    const b = createHotlineGame({ seed: "ft", config: altered });
    for (let i = 0; i < 10; i++) {
      a.spin();
      b.spin();
      expect(b.getSnapshot()).toEqual(a.getSnapshot());
    }
  });
});
