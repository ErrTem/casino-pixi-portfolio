import {
  fromMultHundredths,
  toMultHundredths,
} from "../../../shared/money/cents.js";
import { CRASH_CONFIG } from "./config.js";

/**
 * TEMP RED: linear climb — prove PLAY-02 tests reject non-exponential shape.
 */
export function multiplierAt(
  elapsedMs: number,
  growthRatePerMs: number = CRASH_CONFIG.growthRatePerMs,
): number {
  void growthRatePerMs;
  const t = Math.max(0, elapsedMs);
  const raw = 1 + (2 - 1) * (t / 2500);
  return fromMultHundredths(toMultHundredths(raw));
}
