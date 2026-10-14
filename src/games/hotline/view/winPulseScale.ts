/** smooth 1 to peak to 1 over one period (sin half-cycle) */
export function winPulseScale(
  elapsedMs: number,
  periodMs: number,
  peakScale: number,
): number {
  if (
    !Number.isFinite(elapsedMs) ||
    !Number.isFinite(periodMs) ||
    !Number.isFinite(peakScale)
  ) {
    return 1;
  }
  if (periodMs <= 0 || peakScale <= 0) return 1;
  const t = (((elapsedMs % periodMs) + periodMs) % periodMs) / periodMs;
  const wave = Math.sin(t * Math.PI);
  return 1 + (peakScale - 1) * wave;
}
