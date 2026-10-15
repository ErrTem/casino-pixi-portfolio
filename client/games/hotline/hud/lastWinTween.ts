/**
 * eased lerp for the last win count up (t in 0..1)
 * ease out cubic, same curve as the crash balance tween
 */
export function lastWinTweenValue(
  from: number,
  to: number,
  t01: number,
): number {
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    return Number.isFinite(from) ? from : Number.isFinite(to) ? to : 0;
  }
  const t = Number.isFinite(t01) ? Math.min(1, Math.max(0, t01)) : 0;
  const e = 1 - (1 - t) ** 3;
  return from + (to - from) * e;
}

export interface LastWinTween {
  /** begin a count up from zero, returns the first shown value */
  start: (target: number, nowMs: number) => number;
  valueAt: (nowMs: number) => number;
  isDone: (nowMs: number) => boolean;
}

// small clock driven wrapper so the hud only passes timestamps
export function createLastWinTween(durationMs: number): LastWinTween {
  const duration = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;
  let target = 0;
  let startedAt = 0;

  const progress = (nowMs: number): number =>
    duration <= 0 ? 1 : (nowMs - startedAt) / duration;

  return {
    start(next: number, nowMs: number): number {
      target = next;
      startedAt = nowMs;
      return lastWinTweenValue(0, target, progress(nowMs));
    },
    valueAt(nowMs: number): number {
      return lastWinTweenValue(0, target, progress(nowMs));
    },
    isDone(nowMs: number): boolean {
      return progress(nowMs) >= 1;
    },
  };
}
