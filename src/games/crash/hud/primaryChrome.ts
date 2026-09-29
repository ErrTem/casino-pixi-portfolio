import type { CrashSnapshot } from "../logic/index.js";
import { enablementFrom } from "./enablement.js";
import { formatMoney } from "./format.js";

export type PrimaryChromeKind = "bet" | "cancel" | "cash_out" | "cashed_out";

export interface PrimaryChrome {
  kind: PrimaryChromeKind;
  label: string;
  amountLine: string;
  enabled: boolean;
}

/**
 * Dual-line primary CTA chrome from snapshot + stake display.
 * waiting+no bet → BET (green); waiting+bet → CANCEL (red);
 * flying+bet → CASH OUT (orange); cashed_out → frozen disabled.
 */
export function primaryChromeFrom(
  snap: CrashSnapshot,
  stakeDisplay: number,
): PrimaryChrome {
  const en = enablementFrom(snap);

  if (snap.phase === "cashed_out" && snap.bet != null && snap.cashOutAt != null) {
    return {
      kind: "cashed_out",
      label: "CASHED OUT",
      amountLine: formatMoney(snap.bet * snap.cashOutAt),
      enabled: false,
    };
  }

  if (snap.phase === "flying" && snap.bet != null) {
    return {
      kind: "cash_out",
      label: "CASH OUT",
      amountLine: formatMoney(snap.bet * snap.multiplier),
      enabled: en.canCashOut,
    };
  }

  if (snap.phase === "waiting" && snap.bet != null) {
    return {
      kind: "cancel",
      label: "CANCEL",
      amountLine: formatMoney(snap.bet),
      enabled: en.canCancelBet,
    };
  }

  // waiting no bet / flying spectator / crash snap → BET
  return {
    kind: "bet",
    label: "BET",
    amountLine: formatMoney(stakeDisplay),
    enabled: en.canPlaceBet,
  };
}
