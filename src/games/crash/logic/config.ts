export const CRASH_CONFIG = {
  startingBalanceCents: 500_000, // 5000.00 display
  minBetCents: 1_000, // 10.00
  maxBetCents: 100_000, // 1000.00
  waitDurationMs: 5_000,
  /** delay before 5s countdown */
  crashDisplayMs: 3_000,
  houseEdge: 0.04,
  crashFloor: 1.01,
  crashCap: 100,
  growthRatePerMs: Math.LN2 / 2000,
  multDecimals: 2,
  historySize: 20,
  maxDeltaMs: 100,
} as const;

export type CrashConfig = typeof CRASH_CONFIG;