import { describe, expect, it } from "vitest";
import type { BetSnap, CrashSnapshot } from "../logic/index.js";
import { formatMoney } from "./format.js";
import { primaryChromeFrom } from "./primaryChrome.js";

function emptyBet(partial: Partial<BetSnap> = {}): BetSnap {
  return {
    amount: null,
    cashOutAt: null,
    autoCashOutAt: null,
    cashedOut: false,
    ...partial,
  };
}

function snap(partial: Partial<CrashSnapshot> = {}): CrashSnapshot {
  const bets: [BetSnap, BetSnap] = partial.bets ?? [emptyBet(), emptyBet()];
  return {
    phase: partial.phase ?? "waiting",
    multiplier: partial.multiplier ?? 1,
    balance: partial.balance ?? 5000,
    bets,
    bet: partial.bet !== undefined ? partial.bet : bets[0].amount,
    crashAt: partial.crashAt ?? null,
    waitRemainingMs: partial.waitRemainingMs ?? 5000,
    history: partial.history ?? [],
    roundId: partial.roundId ?? 1,
    autoCashOutAt:
      partial.autoCashOutAt !== undefined
        ? partial.autoCashOutAt
        : bets[0].autoCashOutAt,
    cashOutAt: partial.cashOutAt ?? null,
  };
}

describe("primaryChromeFrom", () => {
  it("waiting -> BET + stake amount, enabled when can place", () => {
    const bet = emptyBet();
    const chrome = primaryChromeFrom(
      snap({ phase: "waiting", balance: 5000 }),
      bet,
      100,
    );
    expect(chrome.kind).toBe("bet");
    expect(chrome.label).toBe("BET");
    expect(chrome.amountLine).toBe(formatMoney(100));
    expect(chrome.enabled).toBe(true);
  });

  it("waiting broke -> BET + stake, disabled", () => {
    const bet = emptyBet();
    const chrome = primaryChromeFrom(
      snap({ phase: "waiting", balance: 5 }),
      bet,
      100,
    );
    expect(chrome.kind).toBe("bet");
    expect(chrome.label).toBe("BET");
    expect(chrome.amountLine).toBe(formatMoney(100));
    expect(chrome.enabled).toBe(false);
  });

  it("waiting + locked bet -> CANCEL + stake, enabled", () => {
    const bet = emptyBet({ amount: 100 });
    const chrome = primaryChromeFrom(
      snap({ phase: "waiting", bets: [bet, emptyBet()], balance: 4900 }),
      bet,
      50,
    );
    expect(chrome.kind).toBe("cancel");
    expect(chrome.label).toBe("CANCEL");
    expect(chrome.amountLine).toBe(formatMoney(100));
    expect(chrome.enabled).toBe(true);
  });

  it("flying + bet -> CASH OUT + live win money", () => {
    const bet = emptyBet({ amount: 100 });
    const chrome = primaryChromeFrom(
      snap({
        phase: "flying",
        bets: [bet, emptyBet()],
        multiplier: 2.5,
      }),
      bet,
      100,
    );
    expect(chrome.kind).toBe("cash_out");
    expect(chrome.label).toBe("CASH OUT");
    expect(chrome.amountLine).toBe(formatMoney(100 * 2.5));
    expect(chrome.enabled).toBe(true);
  });

  it("cashedOut -> CASHED OUT + frozen cashOutAt amount, disabled", () => {
    const bet = emptyBet({
      amount: 100,
      cashOutAt: 1.8,
      cashedOut: true,
    });
    const chrome = primaryChromeFrom(
      snap({
        phase: "cashed_out",
        bets: [bet, emptyBet()],
        cashOutAt: 1.8,
        multiplier: 3,
      }),
      bet,
      100,
    );
    expect(chrome.kind).toBe("cashed_out");
    expect(chrome.label).toBe("CASHED OUT");
    expect(chrome.amountLine).toBe(formatMoney(100 * 1.8));
    expect(chrome.enabled).toBe(false);
  });

  it("flying spectator (bet null) -> disabled BET, no fake live win", () => {
    const bet = emptyBet();
    const chrome = primaryChromeFrom(
      snap({ phase: "flying", multiplier: 4 }),
      bet,
      100,
    );
    expect(chrome.enabled).toBe(false);
    expect(chrome.label).not.toBe("CASH OUT");
    expect(chrome.amountLine).not.toBe(formatMoney(100 * 4));
  });
});
