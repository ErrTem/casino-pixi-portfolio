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
import {
  boostedFreeSpinMath,
  freeSpinTokenOdds,
} from "./features/freeSpins.js";
import { createPickEm, type PickEm } from "./features/pickEm.js";
import {
  createNight,
  type Night,
  type NightSnapshot,
  type NightStep,
} from "./night/createNight.js";
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
  night: NightSnapshot | null;
}

export interface HotlineGame {
  spin(): SpinResult;
  setBetStepIndex(index: number): void;
  getSnapshot(): HotlineSnapshot;
  /** clear one phone meter when its feature starts */
  resetPhoneMeter(color: TokenColor): void;
  isNightActive(): boolean;
  nextNightStep(): NightStep;
  spinFree(): SpinResult;
  pickLocker(index: number): number | null;
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
  const fsEngine = createSpinEngine(
    `${options.seed}:fs`,
    boostedFreeSpinMath(config),
  );
  const fsCollectorsRng = createRng(`${options.seed}:fs-collectors`);
  const pickRng = createRng(`${options.seed}:pick`);
  const wallet = createWallet(math.startingBalanceCents, steps);
  const meters: PhoneMeters = createPhoneMeters(config.features.tokenOdds.meterTarget);
  const comboQueue = createComboQueue();

  let betStepIndex = 0;
  let phase: HotlineSnapshot["phase"] = "idle";
  let grid = idleGrid(config);
  let lineWins: LineWin[] = [];
  let lastWinCents = 0;
  let collectorOutcome: CollectorOutcome = emptyOutcome();
  let night: Night | null = null;
  let featureBetCents = 0;
  let fsSpinPending = false;
  let pickEm: PickEm | null = null;

  function finishPickEm(): void {
    if (!night || !pickEm) return;
    night.settleFeature(pickEm.totalCents());
    pickEm = null;
  }

  function startFeature(color: TokenColor): void {
    if (!night) return;
    if (color === "green") return;
    if (color === "purple") {
      pickEm = createPickEm({
        rng: pickRng,
        config,
        betCents: featureBetCents,
      });
      return;
    }
    // red stub to zero until plan 04-04
    night.settleFeature(0);
  }

  return {
    spin(): SpinResult {
      if (night) return { ok: false, reason: "" };

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

      if (collectorOutcome.queue.length > 0) {
        featureBetCents = betCents;
        night = createNight({
          queue: collectorOutcome.queue,
          freeSpins: {
            spins: config.features.freeSpins.spins,
            retriggerSpins: config.features.freeSpins.retriggerSpins,
            maxRetriggers: config.features.freeSpins.maxRetriggers,
          },
          featureBetCents,
        });
        fsSpinPending = false;
      }

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

    isNightActive(): boolean {
      return night !== null;
    },

    nextNightStep(): NightStep {
      if (!night) return { kind: "done" };
      const step = night.next();
      if (step.kind === "feature_start") {
        startFeature(step.color);
      }
      if (step.kind === "fs_spin") {
        fsSpinPending = true;
      }
      if (step.kind === "feature_exit" && step.color !== "green") {
        wallet.credit(step.totalCents);
      }
      if (step.kind === "done") {
        night = null;
        fsSpinPending = false;
        pickEm = null;
      }
      return step;
    },

    spinFree(): SpinResult {
      if (!night || !fsSpinPending) return { ok: false, reason: "" };

      grid = fsEngine.spin();
      lineWins = evaluatePaylines({
        grid,
        paylines: math.paylines,
        paytable: config.paytable,
        wildId: math.wildSymbolId,
        betCents: featureBetCents,
      });
      lastWinCents = lineWins.reduce((sum, w) => sum + w.payoutCents, 0);
      wallet.credit(lastWinCents);

      collectorOutcome = resolveCollectors({
        rng: fsCollectorsRng,
        tokenOdds: freeSpinTokenOdds(config),
        reels: math.reels,
        rows: math.rows,
      });
      for (const spawn of collectorOutcome.spawns) {
        meters.increment(spawn.color);
      }

      const settled = night.onFsSpinSettled({
        winCents: lastWinCents,
        queue: collectorOutcome.queue,
      });
      fsSpinPending = false;
      if (settled.retriggered) {
        meters.reset("green");
      }

      phase = "settled";
      return { ok: true };
    },

    pickLocker(index: number): number | null {
      if (!pickEm) return null;
      const revealed = pickEm.pick(index);
      if (revealed !== null && pickEm.isDone()) {
        finishPickEm();
      }
      return revealed;
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
        night: night ? night.snapshot() : null,
      };
    },
  };
}
