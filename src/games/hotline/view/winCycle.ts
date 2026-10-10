export interface WinCycle {
  /** start over with `count` winning lines, first line active */
  reset: (count: number) => void;
  /** index of the active line, -1 when there are no wins or the pass is done */
  active: () => number;
  /** returns true when the active line changed */
  advance: (deltaMS: number) => boolean;
  /** true after one full pass of each line (d-13) */
  isDone: () => boolean;
}

// one pass of each line at intervalMs, then done, no wrap
export function createWinCycle(intervalMs: number): WinCycle {
  const interval = Number.isFinite(intervalMs) ? Math.max(1, intervalMs) : 1000;
  let count = 0;
  let index = 0;
  let elapsed = 0;
  let done = true;

  return {
    reset(next: number): void {
      count = Number.isFinite(next) ? Math.max(0, Math.floor(next)) : 0;
      index = 0;
      elapsed = 0;
      done = count === 0;
    },

    active(): number {
      if (done || count === 0) return -1;
      return index;
    },

    advance(deltaMS: number): boolean {
      if (done || count === 0 || !Number.isFinite(deltaMS) || deltaMS <= 0) {
        return false;
      }
      elapsed += deltaMS;
      if (elapsed < interval) return false;
      elapsed = 0;
      // last line held for one interval, then finish
      if (index >= count - 1) {
        done = true;
        return false;
      }
      index += 1;
      return true;
    },

    isDone(): boolean {
      return done;
    },
  };
}
