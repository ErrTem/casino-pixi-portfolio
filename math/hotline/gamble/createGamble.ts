import type { Rng } from "../../rng/createRng.js";

export type GambleSnapshot = {
  stakeCents: number;
  roundsDone: number;
  offered: boolean;
};

export type GambleResolve = {
  survived: boolean;
  // pot after this resolve, doubled on survive and zero on die
  stakeCents: number;
  roundsDone: number;
  offered: boolean;
};

export interface Gamble {
  offer(stakeCents: number): void;
  clear(): void;
  resolve(rng: Rng): GambleResolve | null;
  snapshot(): GambleSnapshot;
}

// equal chance double or nothing, pure math with no wallet or view
export function createGamble(args: {
  maxRounds: number;
  surviveChance: number;
}): Gamble {
  const { maxRounds, surviveChance } = args;
  let stakeCents = 0;
  let roundsDone = 0;
  let offered = false;

  function clear(): void {
    stakeCents = 0;
    roundsDone = 0;
    offered = false;
  }

  function snapshot(): GambleSnapshot {
    return { stakeCents, roundsDone, offered };
  }

  return {
    offer(stake: number): void {
      if (!Number.isInteger(stake) || stake <= 0) {
        clear();
        return;
      }
      stakeCents = stake;
      roundsDone = 0;
      offered = true;
    },

    clear,

    resolve(rng: Rng): GambleResolve | null {
      if (!offered || roundsDone >= maxRounds) return null;
      if (rng.next() < surviveChance) {
        stakeCents *= 2;
        roundsDone += 1;
        offered = roundsDone < maxRounds;
        return { survived: true, stakeCents, roundsDone, offered };
      }
      const rounds = roundsDone;
      clear();
      return { survived: false, stakeCents: 0, roundsDone: rounds, offered: false };
    },

    snapshot,
  };
}
