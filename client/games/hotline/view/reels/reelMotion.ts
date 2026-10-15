// pure timing and easing for the reel strips, units are cells and milliseconds

/** time every reel spins before the first one is allowed to stop */
export const SPIN_MIN_MS = 650;
/** extra wait per reel so stops read left to right */
export const STAGGER_MS = 240;
/** turbo versions of the two waits above */
export const TURBO_SPIN_MIN_MS = 260;
export const TURBO_STAGGER_MS = 90;
/** how long the landing ease takes once a reel is told to stop */
export const LAND_MS = 420;
/** scroll speed while spinning */
export const SPIN_CELLS_PER_MS = 0.011;

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const span = edge1 - edge0;
  if (!(span > 0) || !Number.isFinite(x)) return x >= edge1 ? 1 : 0;
  const t = Math.min(1, Math.max(0, (x - edge0) / span));
  return t * t * (3 - 2 * t);
}

/** ms after spin start when the given reel starts landing */
export function staggerDelayMs(reelIndex: number, turbo = false): number {
  const i = Number.isFinite(reelIndex) ? Math.max(0, Math.floor(reelIndex)) : 0;
  return turbo
    ? TURBO_SPIN_MIN_MS + i * TURBO_STAGGER_MS
    : SPIN_MIN_MS + i * STAGGER_MS;
}

/**
 * strip offset in cells while landing, from `startOffset` (negative) up to 0
 * hermite with the spin speed as start tangent and zero end tangent, so the
 * strip eases out of full speed without a hitch
 * `startTangent` is cells travelled over the whole landing at spin speed
 */
export function landOffset(
  startOffset: number,
  startTangent: number,
  t: number,
): number {
  if (!Number.isFinite(t) || t <= 0) return startOffset;
  if (t >= 1) return 0;
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  return h00 * startOffset + h10 * startTangent + h01 * 0;
}
