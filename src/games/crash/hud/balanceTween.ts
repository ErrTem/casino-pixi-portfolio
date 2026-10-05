/**
 * eased lerp for running balance digits (t in 0..1)
 * ease out cubic so mid-t sits past linear midpoint
 */
export function balanceTweenValue(
  from: number,
  to: number,
  t01: number,
): number {
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    return Number.isFinite(to) ? to : Number.isFinite(from) ? from : 0;
  }
  const t = Number.isFinite(t01) ? Math.min(1, Math.max(0, t01)) : 0;
  // ease-out cubic: 1 - (1-t)^3
  const e = 1 - (1 - t) ** 3;
  return from + (to - from) * e;
}
