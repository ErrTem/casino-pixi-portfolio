export interface WinCycle {
  /** start over with `count` winning lines, first line active */
  reset: (count: number) => void;
  /** index of the active line, -1 when there are no wins */
  active: () => number;
  /** returns true when the active line changed */
  advance: (deltaMS: number) => boolean;
  /** true when there is no cycle (count 0) */
  isDone: () => boolean;
}

// wrap forever while count > 0 so idle can keep highlighting until spin
export function createWinCycle(intervalMs: number): WinCycle {
  const interval = Number.isFinite(intervalMs) ? Math.max(1, intervalMs) : 1000;
  let count = 0;
  let index = 0;
  let elapsed = 0;

  return {
    reset(next: number): void {
      count = Number.isFinite(next) ? Math.max(0, Math.floor(next)) : 0;
      index = 0;
      elapsed = 0;
    },

    active(): number {
      if (count === 0) return -1;
      return index;
    },

    advance(deltaMS: number): boolean {
      if (count === 0 || !Number.isFinite(deltaMS) || deltaMS <= 0) {
        return false;
      }
      elapsed += deltaMS;
      if (elapsed < interval) return false;
      elapsed = 0;
      index = (index + 1) % count;
      return true;
    },

    isDone(): boolean {
      return count === 0;
    },
  };
}
