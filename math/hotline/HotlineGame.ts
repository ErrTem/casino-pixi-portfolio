import { centsToDisplay } from "../money/cents.js";
import { createRng, type Rng } from "../rng/createRng.js";
import type { HotlineConfig } from "./config/HotlineConfigSchema.js";
import { createComboQueue } from "./collectors/ComboQueue.js";
import { createPhoneMeters, type PhoneMeters } from "./collectors/PhoneMeters.js";
import {
  resolveCollectors,
  type CollectorOutcome,
} from "./collectors/resolveCollectors.js";
import { TOKEN_COLOR_ORDER, type TokenColor } from "./collectors/TokenColors.js";
import { evaluatePaylines, type LineWin } from "./evaluatePaylines.js";
import {
  boostedFreeSpinMath,
  freeSpinTokenOdds,
} from "./features/freeSpins.js";
import {
  createHoldAndWin,
  type HoldAndWin,
  type HoldSnapshot,
} from "./features/holdAndWin.js";
import { createPickEm, type PickEm } from "./features/pickEm.js";
import {
  createGamble,
  type GambleResolve,
  type GambleSnapshot,
} from "./gamble/createGamble.js";
import {
  createNight,
  type Night,
  type NightSnapshot,
  type NightStep,
} from "./night/createNight.js";
import { createSlotEngine } from "./SlotEngine.js";
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
  stepHoldRespin(): { done: boolean };
  holdSnapshot(): HoldSnapshot | null;
  /** drop the gamble pot, the credited win stays in the wallet */
  clearGambleOffer(): void;
  /** one survive or die step on the base line win, null when nothing is offered */
  resolveGamble(rng: Rng): GambleResolve | null;
  getGambleSnapshot(): GambleSnapshot;
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

// raw meter fill only, green then red then purple
function meterFillQueue(meters: PhoneMeters, meterTarget: number): TokenColor[] {
  return TOKEN_COLOR_ORDER.filter((color) => meters.getCount(color) >= meterTarget);
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
  const engine = createSlotEngine(options.seed, math);
  const collectorsRng = createRng(`${options.seed}:collectors`);
  const fsEngine = createSlotEngine(
    `${options.seed}:fs`,
    boostedFreeSpinMath(config),
  );
  const fsCollectorsRng = createRng(`${options.seed}:fs-collectors`);
  const pickRng = createRng(`${options.seed}:pick`);
  const holdRng = createRng(`${options.seed}:hold`);
  const wallet = createWallet(math.startingBalanceCents, steps);
  const meters: PhoneMeters = createPhoneMeters(config.features.tokenOdds.meterTarget);
  const comboQueue = createComboQueue();
  const gamble = createGamble(config.features.gamble);

  let betStepIndex = 0;
  let phase: HotlineSnapshot["phase"] = "idle";
  let grid = idleGrid(config);
  let lineWins: LineWin[] = [];
  let lastWinCents = 0;
  let collectorOutcome: CollectorOutcome = emptyOutcome();
  let night: Night | null = null;
  let featureBetCents = 0;
  // base spin line wins only, never night totals or free spin wins
  let baseLineWinCents = 0;
  let fsSpinPending = false;
  let pickEm: PickEm | null = null;
  let hold: HoldAndWin | null = null;

  function finishPickEm(): void {
    if (!night || !pickEm) return;
    night.settleFeature(pickEm.totalCents());
    pickEm = null;
  }

  function finishHold(): void {
    if (!night || !hold) return;
    night.settleFeature(hold.totalCents());
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
    if (color === "red") {
      hold = createHoldAndWin({
        rng: holdRng,
        config,
        betCents: featureBetCents,
      });
      hold.start();
      return;
    }
  }

  return {
    spin(): SpinResult {
      if (night) return { ok: false, reason: "" };

      const betCents = steps[betStepIndex];
      const placed = wallet.placeBet(betCents);
      if (!placed.ok) return placed;
      gamble.clear();
      baseLineWinCents = 0;

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
      baseLineWinCents = lastWinCents;
      if (baseLineWinCents > 0) gamble.offer(baseLineWinCents);

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
      const queue = meterFillQueue(
        meters,
        config.features.tokenOdds.meterTarget,
      );
      collectorOutcome = { ...collectorOutcome, queue };
      comboQueue.set(queue);

      if (queue.length > 0) {
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
        hold = null;
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

      const meterTarget = config.features.tokenOdds.meterTarget;
      const nested = config.features.freeSpins.nested;
      let queue = meterFillQueue(meters, meterTarget).filter((color) => {
        if (color === "green") return true;
        if (color === "red") return nested.red;
        return nested.purple;
      });
      // green land roll when meter did not already queue it
      if (
        !queue.includes("green") &&
        collectorOutcome.spawns.some((s) => s.color === "green") &&
        fsCollectorsRng.next() < config.features.freeSpins.retriggerChance
      ) {
        queue = ["green", ...queue];
      }
      collectorOutcome = { ...collectorOutcome, queue };

      const settled = night.onFsSpinSettled({
        winCents: lastWinCents,
        queue,
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

    stepHoldRespin(): { done: boolean } {
      if (!hold) return { done: true };
      if (!hold.snapshot().done) {
        hold.respin();
      }
      const snap = hold.snapshot();
      if (snap.done) {
        finishHold();
      }
      return { done: snap.done };
    },

    holdSnapshot(): HoldSnapshot | null {
      return hold ? hold.snapshot() : null;
    },

    clearGambleOffer(): void {
      gamble.clear();
      baseLineWinCents = 0;
    },

    resolveGamble(rng: Rng): GambleResolve | null {
      const before = gamble.snapshot();
      const res = gamble.resolve(rng);
      if (!res) return null;
      // the pot is already in the wallet, survive adds it once more and die takes it back
      if (res.survived) wallet.credit(before.stakeCents);
      else wallet.debit(before.stakeCents);
      return res;
    },

    getGambleSnapshot(): GambleSnapshot {
      return gamble.snapshot();
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
