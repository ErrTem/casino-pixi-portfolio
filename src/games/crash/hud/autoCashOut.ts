import { CRASH_CONFIG } from "../logic/config.js";

const AUTO_CO_MIN = CRASH_CONFIG.crashFloor;
const AUTO_CO_MAX = CRASH_CONFIG.crashCap;

/** clamp auto cash out x to [crashFloor, crashCap] */
export function clampAutoCashOut(value: number): number {
  if (!Number.isFinite(value)) return AUTO_CO_MIN;
  const rounded = Math.round(value * 100) / 100;
  return Math.min(AUTO_CO_MAX, Math.max(AUTO_CO_MIN, rounded));
}
