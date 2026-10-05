import { describe, expect, it } from "vitest";
import type { BetSnap, CrashSnapshot } from "../logic/index.js";
import { CRASH_CONFIG } from "../logic/config.js";
import { enablementFrom } from "./enablement.js";

const displayMin = CRASH_CONFIG.minBetCents / 100;

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

describe("enablementFrom - waiting/flying/broke matrix", () => {
  it("waiting + no bet + solvent -> canPlaceBet / canEditBet / chipsEnabled", () => {
    const en = enablementFrom(
      snap({ phase: "waiting", balance: 5000 }),
      emptyBet(),
    );
    expect(en.canPlaceBet).toBe(true);
    expect(en.canCancelBet).toBe(false);
    expect(en.canEditBet).toBe(true);
    expect(en.chipsEnabled).toBe(true);
    expect(en.canCashOut).toBe(false);
    expect(en.canEditAuto).toBe(true);
    expect(en.showBroke).toBe(false);
  });

  it("waiting + locked bet -> cancel on; stake/auto/chips off", () => {
    const bet = emptyBet({ amount: 100 });
    const en = enablementFrom(
      snap({ phase: "waiting", bets: [bet, emptyBet()] }),
      bet,
    );
    expect(en.canPlaceBet).toBe(false);
    expect(en.canCancelBet).toBe(true);
    expect(en.canEditBet).toBe(false);
    expect(en.chipsEnabled).toBe(false);
    expect(en.canCashOut).toBe(false);
    expect(en.canEditAuto).toBe(false);
  });

  it("flying + bet -> canCashOut; stake/auto edit off", () => {
    const bet = emptyBet({ amount: 100 });
    const en = enablementFrom(
      snap({ phase: "flying", bets: [bet, emptyBet()], multiplier: 1.5 }),
      bet,
    );
    expect(en.canCashOut).toBe(true);
    expect(en.canPlaceBet).toBe(false);
    expect(en.canEditBet).toBe(false);
    expect(en.chipsEnabled).toBe(false);
    expect(en.canEditAuto).toBe(false);
  });

  it("flying spectator (bet null) -> cash-out off; stake/auto still editable", () => {
    const bet = emptyBet();
    const en = enablementFrom(
      snap({ phase: "flying", multiplier: 2 }),
      bet,
    );
    expect(en.canCashOut).toBe(false);
    expect(en.canPlaceBet).toBe(false);
    expect(en.canEditBet).toBe(true);
    expect(en.chipsEnabled).toBe(true);
    expect(en.canEditAuto).toBe(true);
  });

  it("balance below display min -> showBroke; place off but stake still editable", () => {
    const bet = emptyBet();
    const en = enablementFrom(
      snap({ phase: "waiting", balance: displayMin - 0.01 }),
      bet,
    );
    expect(en.showBroke).toBe(true);
    expect(en.canPlaceBet).toBe(false);
    expect(en.canEditBet).toBe(true);
    expect(en.chipsEnabled).toBe(true);
    expect(en.canEditAuto).toBe(true);
  });

  it("cashedOut slot -> canPlaceBet false and canCashOut false; stake editable", () => {
    const bet = emptyBet({
      amount: 100,
      cashOutAt: 1.8,
      cashedOut: true,
    });
    const en = enablementFrom(
      snap({
        phase: "cashed_out",
        bets: [bet, emptyBet()],
        cashOutAt: 1.8,
        multiplier: 2.5,
      }),
      bet,
    );
    expect(en.canPlaceBet).toBe(false);
    expect(en.canCashOut).toBe(false);
    expect(en.canEditBet).toBe(true);
    expect(en.chipsEnabled).toBe(true);
    expect(en.canEditAuto).toBe(true);
  });
});
