import { z } from "zod";

// backend-shaped envelope for hotline, parsed once when the session mounts
// every nested bag is a z.object so bad input fails as a ZodError

const positiveInt = z.number().int().positive();

// symbol id to relative weight for one reel strip
const reelWeights = z.record(z.string(), positiveInt);

// one payline is a row index (0..3) for each of the 5 reels, left to right
// the bundled table is illustrative, not the exact table of any real game
const payline = z.array(z.number().int().min(0).max(3)).length(5);

// payout multipliers of the total bet by match length
const payoutRow = z.object({
  "3": z.number().positive(),
  "4": z.number().positive(),
  "5": z.number().positive(),
});

const mathSchema = z
  .object({
    rows: z.literal(4),
    reels: z.literal(5),
    paylineCount: z.literal(40),
    startingBalanceCents: positiveInt,
    betStepsCents: z.array(positiveInt).min(1),
    wildSymbolId: z.string().min(1),
    symbolWeights: z.array(reelWeights).length(5),
    paylines: z.array(payline).length(40),
  })
  .superRefine((m, ctx) => {
    m.symbolWeights.forEach((weights, reel) => {
      if (!(m.wildSymbolId in weights)) {
        ctx.addIssue({
          code: "custom",
          message: `wild symbol missing from reel ${reel} weights`,
          path: ["symbolWeights", reel],
        });
      }
    });
  });

// token meters and per-spin spawn odds, one chance per phone color
const chance01 = z.number().min(0).max(1);
const colorChances = z.object({
  green: chance01,
  red: chance01,
  purple: chance01,
});

const tokenOddsSchema = z
  .object({
    meterTarget: positiveInt,
    perSpinChance: colorChances,
  })
  .strict();

// prize ladders per bonus, as multipliers of the total bet
const bonusPrizeSchema = z
  .object({
    bonusId: z.string().min(1),
    prizeMultipliers: z.array(z.number().positive()).min(1),
    prizeWeights: z.array(positiveInt).optional(),
  })
  .refine(
    (b) => !b.prizeWeights || b.prizeWeights.length === b.prizeMultipliers.length,
    { message: "prizeWeights must match prizeMultipliers length" },
  );

const jackpotMultipliersSchema = z.object({
  mini: z.number().positive(),
  minor: z.number().positive(),
  major: z.number().positive(),
  grand: z.number().positive(),
});

const freeSpinsSchema = z.object({
  spins: positiveInt,
  // replacement wild weight for reels 2..5, reel 1 keeps the base weights
  wildWeights: z.array(positiveInt).length(4),
  retriggerChance: chance01,
  retriggerSpins: positiveInt,
  maxRetriggers: z.number().int().min(0),
  nested: z.object({ red: z.boolean(), purple: z.boolean() }),
});

const holdAndWinSchema = z.object({
  startCells: z.number().int().min(1).max(19),
  respins: positiveInt,
  landChance: chance01,
  jackpotSymbolChance: chance01,
  jackpotTierWeights: z.object({
    mini: positiveInt,
    minor: positiveInt,
    major: positiveInt,
  }),
});

const pickEmSchema = z.object({
  lockers: z.literal(12),
  picks: z.literal(5),
});

// vhs gamble after a base win, chain length and survive odds
const gambleSchema = z.object({
  maxRounds: positiveInt,
  surviveChance: chance01,
});

// runtime reads freeSpins holdAndWin pickEm and gamble knobs at feature play
const featuresSchema = z.object({
  tokenOdds: tokenOddsSchema,
  bonusPrizes: z.array(bonusPrizeSchema).min(1),
  jackpotMultipliers: jackpotMultipliersSchema,
  freeSpins: freeSpinsSchema,
  holdAndWin: holdAndWinSchema,
  pickEm: pickEmSchema,
  gamble: gambleSchema,
});

export const HotlineConfigSchema = z
  .object({
    gameId: z.literal("hotline"),
    version: z.string().min(1),
    math: mathSchema,
    paytable: z.record(z.string(), payoutRow),
    features: featuresSchema,
  })
  .superRefine((cfg, ctx) => {
    for (const id of Object.keys(cfg.paytable)) {
      const known = cfg.math.symbolWeights.every((w) => id in w);
      if (!known) {
        ctx.addIssue({
          code: "custom",
          message: `paytable symbol ${id} missing from reel weights`,
          path: ["paytable", id],
        });
      }
    }

    const ids = cfg.features.bonusPrizes.map((b) => b.bonusId);
    const unique = new Set(ids);
    if (unique.size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        message: "bonusPrizes ids must be unique",
        path: ["features", "bonusPrizes"],
      });
    }
    for (const required of ["pickEm", "holdAndWin"] as const) {
      if (!unique.has(required)) {
        ctx.addIssue({
          code: "custom",
          message: `bonusPrizes must include ${required}`,
          path: ["features", "bonusPrizes"],
        });
      }
    }

    const wild = cfg.math.wildSymbolId;
    cfg.features.freeSpins.wildWeights.forEach((w, i) => {
      const base = cfg.math.symbolWeights[i + 1]?.[wild];
      if (typeof base !== "number" || !(w > base)) {
        ctx.addIssue({
          code: "custom",
          message: `freeSpins.wildWeights[${i}] must be strictly greater than base wild weight`,
          path: ["features", "freeSpins", "wildWeights", i],
        });
      }
    });
  });

export type HotlineConfig = z.infer<typeof HotlineConfigSchema>;
