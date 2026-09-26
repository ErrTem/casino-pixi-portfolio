/**
 * Stoppable requestAnimationFrame clock.
 * Phase 3: call the returned stop fn, then bind app.ticker to the same tick site.
 */
export function startRafClock(
  onFrame: (deltaMs: number) => void,
): () => void {
  let raf = 0;
  let last = performance.now();

  const frame = (now: number): void => {
    const deltaMs = now - last;
    last = now;
    onFrame(deltaMs);
    raf = requestAnimationFrame(frame);
  };

  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
