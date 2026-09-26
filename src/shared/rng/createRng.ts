import seedrandom from "seedrandom";

/** Seeded U(0,1) source — demo RNG, not provably fair. */
export interface Rng {
  next(): number;
}

export function createRng(seed: string): Rng {
  const prng = seedrandom(seed);
  return { next: () => prng() };
}
