import type { Cents } from "../money/cents.js";

export type PlaceBetResult = { ok: true } | { ok: false; reason: string };

export class Wallet {
  private balanceCents: Cents;

  constructor(
    private readonly startingBalanceCents: Cents,
    private readonly betStepsCents: readonly Cents[],
  ) {
    this.balanceCents = startingBalanceCents;
  }

  getBalanceCents(): Cents {
    return this.balanceCents;
  }

  /** deduct a stake that is one of the config bet steps and fits the balance */
  placeBet(amountCents: Cents): PlaceBetResult {
    if (!Number.isInteger(amountCents)) {
      return { ok: false, reason: "invalid_amount" };
    }
    if (!this.betStepsCents.includes(amountCents)) {
      return { ok: false, reason: "invalid_step" };
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

  /** take a whole positive amount back out, false when it does not fit */
  debit(amountCents: Cents): boolean {
    if (!Number.isInteger(amountCents) || amountCents <= 0) return false;
    if (amountCents > this.balanceCents) return false;
    this.balanceCents -= amountCents;
    return true;
  }

  reset(): void {
    this.balanceCents = this.startingBalanceCents;
  }
}

export function createWallet(
  startingBalanceCents: Cents,
  betStepsCents: readonly Cents[],
): Wallet {
  return new Wallet(startingBalanceCents, betStepsCents);
}
