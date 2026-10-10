export interface WinCycle {
  /** start over with `count` winning lines, first line active */
  reset: (count: number) => void;
  /** index of the active line, -1 when there are no wins */
  active: () => number;
  /** returns true when the active line changed */
  advance: (deltaMS: number) => boolean;
  /** true after one full pass of each line (d-13) */
  isDone: () => boolean;
}

// one line at a time, a long frame still moves a single step
// stub isDone keeps wrap behavior so red tests fail on assertions
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
      return count === 0 ? -1 : index;
    },

    advance(deltaMS: number): boolean {
      if (count <= 1 || !Number.isFinite(deltaMS) || deltaMS <= 0) return false;
      elapsed += deltaMS;
      if (elapsed < interval) return false;
      elapsed = 0;
      index = (index + 1) % count;
      return true;
    },

    isDone(): boolean {
      return false;
    },
  };
}
