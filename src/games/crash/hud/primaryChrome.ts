import type { CrashSnapshot } from "../logic/index.js";
import { enablementFrom } from "./enablement.js";
import { formatMoney } from "./format.js";

export type PrimaryChromeKind = "bet" | "cash_out" | "cashed_out";

export interface PrimaryChrome {
  kind: PrimaryChromeKind;
  label: string;
  amountLine: string;
  enabled: boolean;
}

/**
 * Dual-line primary CTA chrome from snapshot + stake display (D-06..D-09).
 * Pure: no DOM, no pixi. Win while flying = bet × multiplier; cashed_out freezes cashOutAt.
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

  // waiting, crashed→waiting snap, flying spectator: BET chrome (no fake CASH OUT win)
  return {
    kind: "bet",
    label: "BET",
    amountLine: formatMoney(stakeDisplay),
    enabled: en.canPlaceBet,
  };
}
