import type { CrashSnapshot } from "../../games/crash/logic/index.js";
import type { SfxEvent } from "./AudioPort.js";

/**
 * Pure prev→next snapshot edge detector for takeoff / cash_out / crash.
 * bet_lock is owned by the HUD placeBet handler — never emitted here.
 */
export function sfxEventsFromTransition(
  prev: CrashSnapshot | null,
  next: CrashSnapshot,
): SfxEvent[] {
  if (!prev) return [];
  const out: SfxEvent[] = [];
  if (prev.phase === "waiting" && next.phase === "flying") out.push("takeoff");
  if (prev.cashOutAt == null && next.cashOutAt != null) out.push("cash_out");
  if (
    prev.phase !== "waiting" &&
    next.phase === "waiting" &&
    next.history.length > prev.history.length
  ) {
    out.push("crash");
  }
  return out;
}
