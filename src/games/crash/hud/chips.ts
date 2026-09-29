import { CRASH_CONFIG } from "../logic/config.js";

/**
 * Preset bet chip values in display units (D-03 / WALT-03Δ).
 * Data-only — chips fill the bet input; placeBet remains the sole submit path.
 */
export const PRESET_CHIPS = [20, 50, 100] as const;

export const ALL_CHIP = "ALL" as const;

export type PresetChip = (typeof PRESET_CHIPS)[number];

const DISPLAY_MAX = CRASH_CONFIG.maxBetCents / 100;

/**
 * Max affordable stake in display units for the ALL chip.
 * Floors balance and clamps to maxBet. Caller disables ALL when result < minBet.
 * Fill-only — never placeBet.
 */
export function maxAffordableStake(balanceDisplay: number): number {
  if (!Number.isFinite(balanceDisplay)) {
    return DISPLAY_MAX;
  }
  const floorBal = Math.floor(balanceDisplay);
  return Math.min(DISPLAY_MAX, floorBal);
}
