import { centsToDisplay } from "../../../shared/money/cents.js";
import type { HotlineConfig } from "../config/HotlineConfigSchema.js";
import { evaluatePaylines, type LineWin } from "./evaluatePaylines.js";
import { createSpinEngine } from "./SpinEngine.js";
import { createWallet } from "./Wallet.js";

export type SpinResult = { ok: true } | { ok: false; reason: string };

export interface HotlineSnapshot {
  phase: "idle" | "settled";
  balanceDisplay: string;
  betDisplay: string;
  lastWinDisplay: string;
  betStepIndex: number;
  grid: string[][];
  lineWins: LineWin[];
  paylineCount: 40;
}

export interface HotlineGame {
  spin(): SpinResult;
  setBetStepIndex(index: number): void;
  getSnapshot(): HotlineSnapshot;
}

export interface CreateHotlineGameOptions {
  seed: string;
  config: HotlineConfig;
}

function money(cents: number): string {
  return centsToDisplay(cents).toFixed(2);
}

// static pre-spin window, plain symbols only so nothing looks like a win
function idleGrid(config: HotlineConfig): string[][] {
  const { reels, rows, wildSymbolId, symbolWeights } = config.math;
  const plain = Object.keys(symbolWeights[0]).filter((id) => id !== wildSymbolId);
  return Array.from({ length: reels }, (_, reel) =>
    Array.from({ length: rows }, (_, row) => plain[(reel * rows + row) % plain.length]),
  );
}

// spin settlement reads math and paytable only, feature tables belong to phase 3
export function createHotlineGame(options: CreateHotlineGameOptions): HotlineGame {
  const { config } = options;
  const { math } = config;
  const steps = math.betStepsCents;
  const engine = createSpinEngine(options.seed, math);
  const wallet = createWallet(math.startingBalanceCents, steps);

  let betStepIndex = 0;
  let phase: HotlineSnapshot["phase"] = "idle";
  let grid = idleGrid(config);
  let lineWins: LineWin[] = [];
  let lastWinCents = 0;

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
      phase = "settled";
      return { ok: true };
    },

    setBetStepIndex(index: number): void {
      // bad input keeps the current step, anything else lands on a real step
      if (!Number.isFinite(index)) return;
      betStepIndex = Math.max(0, Math.min(steps.length - 1, Math.floor(index)));
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
      };
    },
  };
}
