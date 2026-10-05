import { describe, expect, it } from "vitest";
import { createGame } from "../src/games/crash/logic/CrashGame.js";
import { CRASH_CONFIG } from "../src/games/crash/logic/config.js";
import { Wallet } from "../src/games/crash/logic/Wallet.js";
import {
  payoutCents,
  toMultHundredths,
} from "../src/shared/money/cents.js";
describe("wallet - D-01..D-04 / WALT-01 / WALT-02", () => {
  it("starts at 500000 cents after createGame (D-01)", () => {
    const game = createGame({ seed: "wallet-start" });
    expect(game.getSnapshot().balance).toBe(
      CRASH_CONFIG.startingBalanceCents / 100,
    );
    const wallet = new Wallet();
    expect(wallet.getBalanceCents()).toBe(CRASH_CONFIG.startingBalanceCents);
  });

  it("accepts min bet 10 and max bet 1000 when balance allows (WALT-02 boundary)", () => {
    const gameMin = createGame({ seed: "wallet-min" });
    expect(gameMin.placeBet(0, 10)).toEqual({ ok: true });
    expect(gameMin.getSnapshot().bet).toBe(10);
    expect(gameMin.getSnapshot().balance).toBe(4990);

    const gameMax = createGame({ seed: "wallet-max" });
    expect(gameMax.placeBet(0, 1000)).toEqual({ ok: true });
    expect(gameMax.getSnapshot().bet).toBe(1000);
    expect(gameMax.getSnapshot().balance).toBe(4000);
  });

  it("rejects below min 9 and above max 1001 (WALT-02)", () => {
    const game = createGame({ seed: "wallet-oob" });
    expect(game.placeBet(0, 9)).toEqual({ ok: false, reason: "below_min" });
    expect(game.getSnapshot().balance).toBe(5000);
    expect(game.placeBet(0, 1001)).toEqual({ ok: false, reason: "above_max" });
    expect(game.getSnapshot().balance).toBe(5000);
  });

  it("rejects bet greater than balance even when under max", () => {
    const wallet = new Wallet(50_000); // 500.00 display - under max 1000
    expect(wallet.placeBet(60_000)).toEqual({
      ok: false,
      reason: "insufficient_balance",
    });
    expect(wallet.getBalanceCents()).toBe(50_000);
  });

  it("hard-stops with broke when balance is below min bet (D-03)", () => {
    const wallet = new Wallet(500); // 5.00 < min 10.00
    expect(wallet.placeBet(1_000)).toEqual({ ok: false, reason: "broke" });
    expect(wallet.getBalanceCents()).toBe(500);

    const almostMin = new Wallet(999); // still below minBetCents 1000
    expect(almostMin.placeBet(1_000)).toEqual({ ok: false, reason: "broke" });
    expect(almostMin.getBalanceCents()).toBe(999);
  });

  it("resetWallet restores startingBalanceCents 500000 (D-04)", () => {
    const game = createGame({ seed: "wallet-reset" });
    expect(game.placeBet(0, 1000)).toEqual({ ok: true });
    expect(game.getSnapshot().balance).toBe(4000);
    game.resetWallet();
    expect(game.getSnapshot().balance).toBe(
      CRASH_CONFIG.startingBalanceCents / 100,
    );
  });

  it("rejects non-finite bet inputs; balance stays integer cents (WALT-02 / ASVS V5)", () => {
    const game = createGame({ seed: "wallet-nan" });
    const before = game.getSnapshot().balance;
    expect(game.placeBet(0, Number.NaN)).toEqual({
      ok: false,
      reason: "invalid_amount",
    });
    expect(game.placeBet(0, Number.POSITIVE_INFINITY)).toEqual({
      ok: false,
      reason: "invalid_amount",
    });
    expect(game.placeBet(0, Number.NEGATIVE_INFINITY)).toEqual({
      ok: false,
      reason: "invalid_amount",
    });
    expect(game.getSnapshot().balance).toBe(before);
    expect(Number.isInteger(before * 100)).toBe(true);
  });

  it("loss settle decreases balance by stake; win increases by payoutCents (WALT-01)", () => {
    // Unit: stake deduct = loss path; credit(payoutCents) = win path
    const lossWallet = new Wallet(CRASH_CONFIG.startingBalanceCents);
    expect(lossWallet.placeBet(10_000)).toEqual({ ok: true });
    expect(lossWallet.getBalanceCents()).toBe(490_000); // no credit on crash/loss

    const winWallet = new Wallet(CRASH_CONFIG.startingBalanceCents);
    expect(winWallet.placeBet(10_000)).toEqual({ ok: true });
    const payout = payoutCents(10_000, toMultHundredths(2.37));
    winWallet.credit(payout);
    expect(winWallet.getBalanceCents()).toBe(490_000 + payout);
    expect(payout).toBe(Math.floor((10_000 * 237) / 100));

    // Integration loss: bet then crash without cash-out
    const lossGame = createGame({ seed: "wallet-loss" });
    expect(lossGame.placeBet(0, 100)).toEqual({ ok: true });
    lossGame.tick(CRASH_CONFIG.waitDurationMs);
    expect(lossGame.getSnapshot().phase).toBe("flying");
    let guard = 0;
    while (lossGame.getSnapshot().phase === "flying" && guard < 300_000) {
      lossGame.tick(CRASH_CONFIG.maxDeltaMs);
      guard += CRASH_CONFIG.maxDeltaMs;
    }
    expect(lossGame.getSnapshot().phase).toBe("waiting");
    expect(lossGame.getSnapshot().balance).toBe(4900); // 5000 - 100, no credit
  });
});