import {
  centsToDisplay,
  displayToCents,
} from "../../../shared/money/cents.js";
import { createRng, type Rng } from "../../../shared/rng/createRng.js";
import { CRASH_CONFIG } from "./config.js";
import { History } from "./History.js";
import {
  attachBet,
  markCashOutRequested,
  resolveTick,
  setAutoCashOutTarget,
} from "./resolveTick.js";
import {
  createInitialRoundState,
  type CrashSnapshot,
  type RoundState,
} from "./RoundState.js";
import { Wallet } from "./Wallet.js";
import type { PlaceBetResult } from "./Wallet.js";

export interface CreateGameOptions {
  /** Seed for demo RNG (ARCH-01). Not provably fair. */
  seed: string;
}

export interface CrashGame {
  /**
   * Place a bet in display units (e.g. `100` = 100.00) while waiting.
   * Converted to integer cents internally.
   */
  placeBet(amountDisplay: number): PlaceBetResult;
  requestCashOut(): void;
  setAutoCashOut(target: number | null): void;
  /** Advance simulation by deltaMs (sub-stepped at maxDeltaMs). */
  tick(deltaMs: number): void;
  getSnapshot(): CrashSnapshot;
  resetWallet(): void;
}

/**
 * Pure GameLogic facade — commands in / snapshots out.
 * No pixi.js / DOM.
 */
export function createGame(options: CreateGameOptions): CrashGame {
  const rng: Rng = createRng(options.seed);
  const wallet = new Wallet(CRASH_CONFIG.startingBalanceCents);
  const history = new History(CRASH_CONFIG.historySize);
  let state: RoundState = createInitialRoundState();

  const deps = { rng, wallet, history };

  return {
    placeBet(amountDisplay: number): PlaceBetResult {
      if (state.phase !== "waiting") {
        return { ok: false, reason: "not_waiting" };
      }
      if (state.lockedBetCents != null) {
        return { ok: false, reason: "bet_already_placed" };
      }
      // ASVS V5: reject non-finite display at command boundary before cents convert
      if (!Number.isFinite(amountDisplay)) {
        return { ok: false, reason: "invalid_amount" };
      }
      const amountCents = displayToCents(amountDisplay);
      const result = wallet.placeBet(amountCents);
      if (!result.ok) return result;
      state = attachBet(state, amountCents);
      return { ok: true };
    },

    requestCashOut(): void {
      state = markCashOutRequested(state);
    },

    setAutoCashOut(target: number | null): void {
      state = setAutoCashOutTarget(state, target);
    },

    tick(deltaMs: number): void {
      let remaining = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;
      while (remaining > 0) {
        const step = Math.min(remaining, CRASH_CONFIG.maxDeltaMs);
        state = resolveTick(state, step, deps);
        remaining -= step;
      }
    },

    getSnapshot(): CrashSnapshot {
      return {
        phase: state.phase,
        multiplier: state.multiplier,
        balance: centsToDisplay(wallet.getBalanceCents()),
        bet:
          state.lockedBetCents != null
            ? centsToDisplay(state.lockedBetCents)
            : null,
        crashAt: state.crashAt,
        cashOutAt: state.cashOutAt,
        waitRemainingMs: state.waitRemainingMs,
        history: history.toArray(),
        roundId: state.roundId,
        autoCashOutAt: state.autoCashOutAt,
      };
    },

    resetWallet(): void {
      wallet.reset();
    },
  };
}

export type { CrashSnapshot, PlaceBetResult };
