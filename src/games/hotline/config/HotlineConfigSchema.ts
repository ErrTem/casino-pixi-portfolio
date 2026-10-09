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

// token meters, one chance per spin for each colored diskette
const tokenOddsSchema = z.object({
  meterTarget: positiveInt,
  perSpinChance: z.object({
    pink: z.number().min(0).max(1),
    cyan: z.number().min(0).max(1),
    yellow: z.number().min(0).max(1),
  }),
});

// prize ladders per bonus, as multipliers of the total bet
const bonusPrizeSchema = z.object({
  bonusId: z.string().min(1),
  prizeMultipliers: z.array(z.number().positive()).min(1),
});

const jackpotMultipliersSchema = z.object({
  mini: z.number().positive(),
  minor: z.number().positive(),
  major: z.number().positive(),
  grand: z.number().positive(),
});

// features are validated now and only read by the runtime in later phases
const featuresSchema = z.object({
  tokenOdds: tokenOddsSchema,
  bonusPrizes: z.array(bonusPrizeSchema).min(1),
  jackpotMultipliers: jackpotMultipliersSchema,
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
  });

export type HotlineConfig = z.infer<typeof HotlineConfigSchema>;
