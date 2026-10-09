import type { HotlineConfig } from "../config/HotlineConfigSchema.js";
import type { LineWin } from "./evaluatePaylines.js";

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

export function createHotlineGame(_options: CreateHotlineGameOptions): HotlineGame {
  const snap: HotlineSnapshot = {
    phase: "idle",
    balanceDisplay: "0.00",
    betDisplay: "0.00",
    lastWinDisplay: "0.00",
    betStepIndex: 0,
    grid: [],
    lineWins: [],
    paylineCount: 40,
  };
  return {
    spin: () => ({ ok: false, reason: "not_implemented" }),
    setBetStepIndex: () => {},
    getSnapshot: () => snap,
  };
}
