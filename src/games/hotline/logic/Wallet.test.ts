import { describe, expect, it } from "vitest";
import { createWallet } from "./Wallet.js";

describe("Wallet.debit", () => {
  it("subtracts an integer amount that fits the balance", () => {
    const w = createWallet(1000, [10]);
    expect(w.debit(250)).toBe(true);
    expect(w.getBalanceCents()).toBe(750);
  });

  it("allows draining the balance to zero", () => {
    const w = createWallet(500, [10]);
    expect(w.debit(500)).toBe(true);
    expect(w.getBalanceCents()).toBe(0);
  });

  it("returns false and keeps the balance when the amount is too big", () => {
    const w = createWallet(500, [10]);
    expect(w.debit(501)).toBe(false);
    expect(w.getBalanceCents()).toBe(500);
  });

  it("rejects zero, negative, fractional and non finite amounts", () => {
    const w = createWallet(500, [10]);
    for (const bad of [0, -10, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(w.debit(bad)).toBe(false);
    }
    expect(w.getBalanceCents()).toBe(500);
  });

  it("credit after debit lands on the same balance", () => {
    const w = createWallet(500, [10]);
    w.debit(200);
    w.credit(200);
    expect(w.getBalanceCents()).toBe(500);
  });
});
