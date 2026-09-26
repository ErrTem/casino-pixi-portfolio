/** Named tunables for Crash GameLogic (D-01..D-14, D-12). */
export const CRASH_CONFIG = {
  startingBalanceCents: 500_000, // 5000.00 display
  minBetCents: 1_000, // 10.00
  maxBetCents: 100_000, // 1000.00
  waitDurationMs: 5_000,
  houseEdge: 0.04, // ~4% within D-08 3–5%
  crashFloor: 1.01, // D-06
  crashCap: 100, // D-07
  growthRatePerMs: Math.LN2 / 2500, // ~2× @ 2.5s (D-09)
  multDecimals: 2,
  historySize: 20,
  maxDeltaMs: 100,
} as const;

export type CrashConfig = typeof CRASH_CONFIG;
