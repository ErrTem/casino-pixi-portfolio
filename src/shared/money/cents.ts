/** Integer cents — avoid float settle bugs. */
export type Cents = number;

/** Multiplier as hundredths (200 = 2.00×). */
export type MultHundredths = number;

export function toMultHundredths(m: number): MultHundredths {
  return Math.round(m * 100);
}

export function fromMultHundredths(h: MultHundredths): number {
  return h / 100;
}

/** Display units (e.g. 100.00) → integer cents. */
export function displayToCents(display: number): Cents {
  return Math.round(display * 100);
}

/** Integer cents → display units. */
export function centsToDisplay(cents: Cents): number {
  return cents / 100;
}

/** Payout in cents: stake × multiplier, floored to cent. */
export function payoutCents(stakeCents: Cents, mult: MultHundredths): Cents {
  return Math.floor((stakeCents * mult) / 100);
}
