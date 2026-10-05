import type { BetSnap, CrashSnapshot } from "../logic/index.js";
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
 * waiting+no bet -> BET
 * waiting+bet -> CANCEL
 * flying+bet -> CASH OUT
 * cashedOut -> frozen disabled
 */
export function primaryChromeFrom(
  snap: CrashSnapshot,
  bet: BetSnap,
  stakeDisplay: number,
): PrimaryChrome {
  const en = enablementFrom(snap, bet);

  if (bet.cashedOut && bet.amount != null && bet.cashOutAt != null) {
    return {
      kind: "cashed_out",
      label: "CASHED OUT",
      amountLine: formatMoney(bet.amount * bet.cashOutAt),
      enabled: false,
    };
  }

  if (snap.phase === "flying" && bet.amount != null && !bet.cashedOut) {
    return {
      kind: "cash_out",
      label: "CASH OUT",
      amountLine: formatMoney(bet.amount * snap.multiplier),
      enabled: en.canCashOut,
    };
  }

  if (snap.phase === "waiting" && bet.amount != null && !bet.cashedOut) {
    return {
      kind: "cancel",
      label: "CANCEL",
      amountLine: formatMoney(bet.amount),
      enabled: en.canCancelBet,
    };
  }

  // waiting no bet / flying spectator / crash snap -> BET
  return {
    kind: "bet",
    label: "BET",
    amountLine: formatMoney(stakeDisplay),
    enabled: en.canPlaceBet,
  };
}
