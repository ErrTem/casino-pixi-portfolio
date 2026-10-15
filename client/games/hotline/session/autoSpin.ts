import type { SpinResult } from "../../../../math/hotline/HotlineGame.js";

// pure auto spin rules, the session owns the ticker and the clicks

/** idle wait between auto spins */
export const AUTO_GAP_MS = 600;
/** shorter wait with turbo, never lower so an empty wallet cannot spin loop */
export const TURBO_AUTO_GAP_MS = 200;

export function autoGapMs(turbo: boolean): number {
  return turbo ? TURBO_AUTO_GAP_MS : AUTO_GAP_MS;
}

export interface ShouldAutoSpinArgs {
  autoOn: boolean;
  /** nothing is presenting, no feature, splash or gamble */
  idle: boolean;
  busy: boolean;
  spinning: boolean;
  infoOpen: boolean;
  /** ms spent idle since the last spin or since auto turned on */
  idleMs: number;
  gapMs: number;
}

export function shouldAutoSpin(args: ShouldAutoSpinArgs): boolean {
  if (!args.autoOn || !args.idle) return false;
  if (args.busy || args.spinning || args.infoOpen) return false;
  return args.idleMs >= args.gapMs;
}

// a refusal with a reason (such as no balance) ends auto, an empty reason is just not ready
export function shouldStopAuto(result: SpinResult): boolean {
  return !result.ok && result.reason !== "";
}
