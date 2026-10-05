import {
  fromMultHundredths,
  toMultHundredths,
} from "../../../shared/money/cents.js";
import type { Rng } from "../../../shared/rng/createRng.js";
import { CRASH_CONFIG, type CrashConfig } from "./config.js";

/**
 * house edge sampler
 * demo RNG only not provably fair
 */
export function sampleCrashAt(
  rng: Rng,
  cfg: CrashConfig = CRASH_CONFIG,
): number {
  const u = Math.min(Math.max(rng.next(), Number.EPSILON), 1 - Number.EPSILON);
  const raw = (1 - cfg.houseEdge) / u;
  const clamped = Math.min(cfg.crashCap, Math.max(cfg.crashFloor, raw));
  return fromMultHundredths(toMultHundredths(clamped));
}
