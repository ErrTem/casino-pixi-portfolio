import { describe, expect, it } from "vitest";
import type { CrashSnapshot } from "../logic/index.js";
import { formatMoney } from "./format.js";
import { primaryChromeFrom } from "./primaryChrome.js";

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

describe("primaryChromeFrom (D-06..D-09)", () => {
  it("waiting → BET + stake amount, enabled when can place", () => {
    const chrome = primaryChromeFrom(snap({ phase: "waiting", bet: null, balance: 5000 }), 100);
    expect(chrome.kind).toBe("bet");
    expect(chrome.label).toBe("BET");
    expect(chrome.amountLine).toBe(formatMoney(100));
    expect(chrome.enabled).toBe(true);
  });

  it("waiting broke → BET + stake, disabled", () => {
    const chrome = primaryChromeFrom(snap({ phase: "waiting", bet: null, balance: 5 }), 100);
    expect(chrome.kind).toBe("bet");
    expect(chrome.label).toBe("BET");
    expect(chrome.amountLine).toBe(formatMoney(100));
    expect(chrome.enabled).toBe(false);
  });

  it("flying + bet → CASH OUT + live win money", () => {
    const chrome = primaryChromeFrom(
      snap({ phase: "flying", bet: 100, multiplier: 2.5 }),
      100,
    );
    expect(chrome.kind).toBe("cash_out");
    expect(chrome.label).toBe("CASH OUT");
    expect(chrome.amountLine).toBe(formatMoney(100 * 2.5));
    expect(chrome.enabled).toBe(true);
  });

  it("cashed_out → CASHED OUT + frozen cashOutAt amount, disabled", () => {
    const chrome = primaryChromeFrom(
      snap({
        phase: "cashed_out",
        bet: 100,
        cashOutAt: 1.8,
        multiplier: 3,
      }),
      100,
    );
    expect(chrome.kind).toBe("cashed_out");
    expect(chrome.label).toBe("CASHED OUT");
    expect(chrome.amountLine).toBe(formatMoney(100 * 1.8));
    expect(chrome.enabled).toBe(false);
  });

  it("flying spectator (bet null) → disabled, no fake live win", () => {
    const chrome = primaryChromeFrom(
      snap({ phase: "flying", bet: null, multiplier: 4 }),
      100,
    );
    expect(chrome.enabled).toBe(false);
    expect(chrome.label).not.toBe("CASH OUT");
    expect(chrome.amountLine).not.toBe(formatMoney(100 * 4));
  });

  it("no CRASHED kind — crashed phase snaps to BET chrome", () => {
    const chrome = primaryChromeFrom(snap({ phase: "crashed", bet: null }), 50);
    expect(chrome.kind).not.toBe("crashed");
    expect(chrome.label).toBe("BET");
    expect(chrome.amountLine).toBe(formatMoney(50));
  });
});
