import type { Cents } from "../../../shared/money/cents.js";
import { CRASH_CONFIG } from "./config.js";

export type PlaceBetResult =
  | { ok: true }
  | { ok: false; reason: string };

export class Wallet {
  private balanceCents: Cents;

  constructor(startingBalanceCents: Cents = CRASH_CONFIG.startingBalanceCents) {
    this.balanceCents = startingBalanceCents;
  }

  getBalanceCents(): Cents {
    return this.balanceCents;
  }

  /**
   * deduct a stake if amount is finite integer cents within min/max and <= balance
   */
  placeBet(amountCents: Cents): PlaceBetResult {
    if (!Number.isFinite(amountCents) || !Number.isInteger(amountCents)) {
      return { ok: false, reason: "invalid_amount" };
    }
    // reject below min balance
    if (this.balanceCents < CRASH_CONFIG.minBetCents) {
      return { ok: false, reason: "broke" };
    }
    if (amountCents < CRASH_CONFIG.minBetCents) {
      return { ok: false, reason: "below_min" };
    }
    if (amountCents > CRASH_CONFIG.maxBetCents) {
      return { ok: false, reason: "above_max" };
    }
    if (amountCents > this.balanceCents) {
      return { ok: false, reason: "insufficient_balance" };
    }
    this.balanceCents -= amountCents;
    return { ok: true };
  }

  credit(amountCents: Cents): void {
    if (!Number.isFinite(amountCents) || amountCents <= 0) return;
    this.balanceCents += Math.floor(amountCents);
  }

  /** refund previously locked stake, cancel whille waiting */
  refund(amountCents: Cents): void {
    this.credit(amountCents);
  }

  /** restore starting demo balance */
  reset(): void {
    this.balanceCents = CRASH_CONFIG.startingBalanceCents;
  }
}
