import { describe, expect, it } from "vitest";
import type { CrashSnapshot } from "../logic/index.js";
import { CRASH_CONFIG } from "../logic/config.js";
import { enablementFrom } from "./enablement.js";

const displayMin = CRASH_CONFIG.minBetCents / 100;

function snap(partial: Partial<CrashSnapshot>): CrashSnapshot {
  return {
    phase: "waiting",
    multiplier: 1,
    balance: 5000,
    bet: null,
    crashAt: null,
    waitRemainingMs: 5000,
    history: [],
    roundId: 1,
    autoCashOutAt: null,
    cashOutAt: null,
    ...partial,
  };
}

describe("enablementFrom — waiting/flying/broke matrix", () => {
  it("waiting + no bet + solvent → canPlaceBet / canEditBet / chipsEnabled", () => {
    const en = enablementFrom(snap({ phase: "waiting", bet: null, balance: 5000 }));
    expect(en.canPlaceBet).toBe(true);
    expect(en.canEditBet).toBe(true);
    expect(en.chipsEnabled).toBe(true);
    expect(en.canCashOut).toBe(false);
    expect(en.canEditAuto).toBe(true);
    expect(en.showBroke).toBe(false);
  });

  it("waiting + locked bet → place/edit/chips off, cash-out off", () => {
    const en = enablementFrom(snap({ phase: "waiting", bet: 100 }));
    expect(en.canPlaceBet).toBe(false);
    expect(en.canEditBet).toBe(false);
    expect(en.chipsEnabled).toBe(false);
    expect(en.canCashOut).toBe(false);
    expect(en.canEditAuto).toBe(true);
  });

  it("flying + bet → canCashOut true and canPlaceBet false", () => {
    const en = enablementFrom(
      snap({ phase: "flying", bet: 100, multiplier: 1.5 }),
    );
    expect(en.canCashOut).toBe(true);
    expect(en.canPlaceBet).toBe(false);
    expect(en.canEditBet).toBe(false);
    expect(en.chipsEnabled).toBe(false);
    expect(en.canEditAuto).toBe(true);
  });

  it("flying spectator (bet null) → cash-out off", () => {
    const en = enablementFrom(
      snap({ phase: "flying", bet: null, multiplier: 2 }),
    );
    expect(en.canCashOut).toBe(false);
    expect(en.canPlaceBet).toBe(false);
    expect(en.canEditAuto).toBe(true);
  });

  it("balance below display min → showBroke and place/edit/chips disabled", () => {
    const en = enablementFrom(
      snap({ phase: "waiting", bet: null, balance: displayMin - 0.01 }),
    );
    expect(en.showBroke).toBe(true);
    expect(en.canPlaceBet).toBe(false);
    expect(en.canEditBet).toBe(false);
    expect(en.chipsEnabled).toBe(false);
    expect(en.canEditAuto).toBe(true);
  });

  it("cashed_out with a bet → canPlaceBet false and canCashOut false", () => {
    const en = enablementFrom(
      snap({
        phase: "cashed_out",
        bet: 100,
        cashOutAt: 1.8,
        multiplier: 2.5,
      }),
    );
    expect(en.canPlaceBet).toBe(false);
    expect(en.canCashOut).toBe(false);
    expect(en.canEditBet).toBe(false);
    expect(en.chipsEnabled).toBe(false);
  });
});
