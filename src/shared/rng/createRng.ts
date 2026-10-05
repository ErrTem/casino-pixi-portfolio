import seedrandom from "seedrandom";

/** seeded U(0,1) source  demo RNG not  fair */
export interface Rng {
  next(): number;
}

export function createRng(seed: string): Rng {
  const prng = seedrandom(seed);
  return { next: () => prng() };
}
