import {
  centsToDisplay,
  displayToCents,
} from "../../../shared/money/cents.js";
import { createRng, type Rng } from "../../../shared/rng/createRng.js";
import { CRASH_CONFIG } from "./config.js";
import { History } from "./History.js";
import {
  attachBet,
  clearLockedBet,
  firstCashOutAt,
  markCashOutRequested,
  resolveTick,
  setAutoCashOutTarget,
} from "./resolveTick.js";
import {
  createInitialRoundState,
  type BetSlotId,
  type BetSnap,
  type CrashSnapshot,
  type RoundState,
} from "./RoundState.js";
import { Wallet } from "./Wallet.js";
import type { PlaceBetResult } from "./Wallet.js";

export interface CreateGameOptions {
  /**seed for demo,not provably fair */
  seed: string;
}

export interface CrashGame {
  placeBet(slot: BetSlotId, amountDisplay: number): PlaceBetResult;
  /** cancel a locked waiting bet on a slot and refund stake */
  cancelBet(slot: BetSlotId): PlaceBetResult;
  requestCashOut(slot: BetSlotId): void;
  /** request cashout on every flying unsettled slot  */
  requestCashOutAll(): void;
  setAutoCashOut(slot: BetSlotId, target: number | null): void;
  /** advance simulation by deltaMs (sub stepped at maxDeltaMs) */
  tick(deltaMs: number): void;
  getSnapshot(): CrashSnapshot;
  resetWallet(): void;
}

function slotToSnap(slot: RoundState["slots"][number]): BetSnap {
  const cashedOut = slot.settled && slot.cashOutAt != null;
  let amount: number | null = null;
  if (slot.lockedBetCents != null) {
    amount = centsToDisplay(slot.lockedBetCents);
  } else if (cashedOut && slot.paidStakeCents != null) {
    amount = centsToDisplay(slot.paidStakeCents);
  }
  return {
    amount,
    cashOutAt: slot.cashOutAt,
    autoCashOutAt: slot.autoCashOutAt,
    cashedOut,
  };
}

/**
 * GameLogic facade
 */
export function createGame(options: CreateGameOptions): CrashGame {
  const rng: Rng = createRng(options.seed);
  const wallet = new Wallet(CRASH_CONFIG.startingBalanceCents);
  const history = new History(CRASH_CONFIG.historySize);
  let state: RoundState = createInitialRoundState();

  const deps = { rng, wallet, history };

  return {
    placeBet(slot: BetSlotId, amountDisplay: number): PlaceBetResult {
      if (state.phase !== "waiting") {
        return { ok: false, reason: "not_waiting" };
      }
      if (state.slots[slot].lockedBetCents != null) {
        return { ok: false, reason: "bet_already_placed" };
      }
      if (!Number.isFinite(amountDisplay)) {
        return { ok: false, reason: "invalid_amount" };
      }
      const amountCents = displayToCents(amountDisplay);
      const result = wallet.placeBet(amountCents);
      if (!result.ok) return result;
      state = attachBet(state, slot, amountCents);
      return { ok: true };
    },

    cancelBet(slot: BetSlotId): PlaceBetResult {
      if (state.phase !== "waiting") {
        return { ok: false, reason: "not_waiting" };
      }
      const locked = state.slots[slot].lockedBetCents;
      if (locked == null) {
        return { ok: false, reason: "no_bet" };
      }
      wallet.refund(locked);
      state = clearLockedBet(state, slot);
      return { ok: true };
    },

    requestCashOut(slot: BetSlotId): void {
      state = markCashOutRequested(state, slot);
    },

    requestCashOutAll(): void {
      state = markCashOutRequested(state, 0);
      state = markCashOutRequested(state, 1);
    },

    setAutoCashOut(slot: BetSlotId, target: number | null): void {
      state = setAutoCashOutTarget(state, slot, target);
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
      const bets: [BetSnap, BetSnap] = [
        slotToSnap(state.slots[0]),
        slotToSnap(state.slots[1]),
      ];
      return {
        phase: state.phase,
        multiplier: state.multiplier,
        balance: centsToDisplay(wallet.getBalanceCents()),
        bets,
        bet: bets[0].amount,
        cashOutAt: firstCashOutAt(state.slots),
        crashAt: state.crashAt,
        waitRemainingMs: state.waitRemainingMs,
        history: history.toArray(),
        roundId: state.roundId,
        autoCashOutAt: bets[0].autoCashOutAt,
      };
    },

    resetWallet(): void {
      wallet.reset();
    },
  };
}

export type { CrashSnapshot, PlaceBetResult, BetSlotId, BetSnap };
