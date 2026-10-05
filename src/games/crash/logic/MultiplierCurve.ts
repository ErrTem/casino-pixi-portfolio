import {
  fromMultHundredths,
  toMultHundredths,
} from "../../../shared/money/cents.js";
import { CRASH_CONFIG } from "./config.js";

/**
 * exponential growth e^(growthRatePerMs x t), rounded to 2dp
 */
export function multiplierAt(
  elapsedMs: number,
  growthRatePerMs: number = CRASH_CONFIG.growthRatePerMs,
): number {
  const raw = Math.exp(growthRatePerMs * Math.max(0, elapsedMs));
  return fromMultHundredths(toMultHundredths(raw));
}
