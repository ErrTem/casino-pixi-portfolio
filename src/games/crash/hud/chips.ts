import { CRASH_CONFIG } from "../logic/config.js";

export const PRESET_CHIPS = [1, 5, 10, 20, 50] as const;

export type PresetChip = (typeof PRESET_CHIPS)[number];

const DISPLAY_MAX = CRASH_CONFIG.maxBetCents / 100;
const DISPLAY_MIN = CRASH_CONFIG.minBetCents / 100;

export function clampStake(value: number): number {
  if (!Number.isFinite(value)) return DISPLAY_MIN;
  return Math.min(DISPLAY_MAX, Math.max(DISPLAY_MIN, Math.floor(value)));
}

export function maxAffordableStake(balanceDisplay: number): number {
  if (!Number.isFinite(balanceDisplay)) {
    return DISPLAY_MAX;
  }
  const floorBal = Math.floor(balanceDisplay);
  return Math.min(DISPLAY_MAX, floorBal);
}
