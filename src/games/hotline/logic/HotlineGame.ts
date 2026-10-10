import { centsToDisplay } from "../../../shared/money/cents.js";
import { createRng } from "../../../shared/rng/createRng.js";
import type { HotlineConfig } from "../config/HotlineConfigSchema.js";
import { createComboQueue } from "./collectors/ComboQueue.js";
import { createPhoneMeters, type PhoneMeters } from "./collectors/PhoneMeters.js";
import {
  resolveCollectors,
  type CollectorOutcome,
} from "./collectors/resolveCollectors.js";
import type { TokenColor } from "./collectors/TokenColors.js";
import { evaluatePaylines, type LineWin } from "./evaluatePaylines.js";
import { createSpinEngine } from "./SpinEngine.js";
import { createWallet } from "./Wallet.js";

export type SpinResult = { ok: true } | { ok: false; reason: string };

export type MeterFills = Record<TokenColor, { count: number; display: number }>;

export interface HotlineSnapshot {
  phase: "idle" | "settled";
  balanceDisplay: string;
  betDisplay: string;
  lastWinDisplay: string;
  betStepIndex: number;
  grid: string[][];
  lineWins: LineWin[];
  paylineCount: 40;
  collectorOutcome: CollectorOutcome;
  meterFills: MeterFills;
}

export interface HotlineGame {
  spin(): SpinResult;
  setBetStepIndex(index: number): void;
  getSnapshot(): HotlineSnapshot;
  /** clear one phone meter when its stub beat pops (d-07, d-12) */
  resetPhoneMeter(color: TokenColor): void;
}

export interface CreateHotlineGameOptions {
  seed: string;
  config: HotlineConfig;
}

function money(cents: number): string {
  return centsToDisplay(cents).toFixed(2);
}

function emptyOutcome(): CollectorOutcome {
  return { spawns: [], queue: [] };
}

// static pre-spin window, plain symbols only so nothing looks like a win
function idleGrid(config: HotlineConfig): string[][] {
  const { reels, rows, wildSymbolId, symbolWeights } = config.math;
  const plain = Object.keys(symbolWeights[0]).filter((id) => id !== wildSymbolId);
  return Array.from({ length: reels }, (_, reel) =>
    Array.from({ length: rows }, (_, row) => plain[(reel * rows + row) % plain.length]),
  );
}

// spin settles paylines then books collectors on a separate rng stream
export function createHotlineGame(options: CreateHotlineGameOptions): HotlineGame {
  const { config } = options;
  const { math } = config;
  const steps = math.betStepsCents;
  const engine = createSpinEngine(options.seed, math);
  const collectorsRng = createRng(`${options.seed}:collectors`);
  const wallet = createWallet(math.startingBalanceCents, steps);
  const meters: PhoneMeters = createPhoneMeters(config.features.tokenOdds.meterTarget);
  const comboQueue = createComboQueue();

  let betStepIndex = 0;
  let phase: HotlineSnapshot["phase"] = "idle";
  let grid = idleGrid(config);
  let lineWins: LineWin[] = [];
  let lastWinCents = 0;
  let collectorOutcome: CollectorOutcome = emptyOutcome();

  return {
    spin(): SpinResult {
      const betCents = steps[betStepIndex];
      const placed = wallet.placeBet(betCents);
      if (!placed.ok) return placed;

      grid = engine.spin();
      lineWins = evaluatePaylines({
        grid,
        paylines: math.paylines,
        paytable: config.paytable,
        wildId: math.wildSymbolId,
        betCents,
      });
      lastWinCents = lineWins.reduce((sum, w) => sum + w.payoutCents, 0);
      wallet.credit(lastWinCents);

      collectorOutcome = resolveCollectors({
        rng: collectorsRng,
        tokenOdds: config.features.tokenOdds,
        reels: math.reels,
        rows: math.rows,
      });
      // book every spawn once at settle, presentation fills are later
      for (const spawn of collectorOutcome.spawns) {
        meters.increment(spawn.color);
      }
      comboQueue.set(collectorOutcome.queue);

      phase = "settled";
      return { ok: true };
    },

    setBetStepIndex(index: number): void {
      // bad input keeps the current step, anything else lands on a real step
      if (!Number.isFinite(index)) return;
      betStepIndex = Math.max(0, Math.min(steps.length - 1, Math.floor(index)));
    },

    resetPhoneMeter(color: TokenColor): void {
      meters.reset(color);
    },

    getSnapshot(): HotlineSnapshot {
      return {
        phase,
        balanceDisplay: money(wallet.getBalanceCents()),
        betDisplay: money(steps[betStepIndex]),
        lastWinDisplay: money(lastWinCents),
        betStepIndex,
        grid,
        lineWins,
        paylineCount: 40,
        collectorOutcome,
        meterFills: meters.snapshot(),
      };
    },
  };
}
