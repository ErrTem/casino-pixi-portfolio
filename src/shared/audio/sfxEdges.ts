import type { CrashSnapshot } from "../../games/crash/logic/index.js";
import type { SfxEvent } from "./AudioPort.js";

/**
 * Pure prev→next snapshot edge detector for takeoff / cash_out / crash.
 * bet_lock is owned by the HUD placeBet handler — never emitted here.
 * RED stub: returns [] so edge tests fail until GREEN.
 */
export function sfxEventsFromTransition(
  _prev: CrashSnapshot | null,
  _next: CrashSnapshot,
): SfxEvent[] {
  return [];
}
