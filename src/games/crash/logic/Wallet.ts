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
   * Deduct a stake if amount is finite integer cents within min/max and ≤ balance.
   * No auto top-up (D-03).
   */
  placeBet(amountCents: Cents): PlaceBetResult {
    if (!Number.isFinite(amountCents) || !Number.isInteger(amountCents)) {
      return { ok: false, reason: "invalid_amount" };
    }
    // D-03 hard-stop: below min balance rejects before other amount rules
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

  /** Refund a previously locked stake (cancel bet while waiting). */
  refund(amountCents: Cents): void {
    this.credit(amountCents);
  }

  /** Restore starting demo balance (D-04). */
  reset(): void {
    this.balanceCents = CRASH_CONFIG.startingBalanceCents;
  }
}
