import {
  fromMultHundredths,
  payoutCents,
  toMultHundredths,
  type Cents,
} from "../../../shared/money/cents.js";
import type { Rng } from "../../../shared/rng/createRng.js";
import { CRASH_CONFIG } from "./config.js";
import { sampleCrashAt } from "./CrashRng.js";
import type { History } from "./History.js";
import { multiplierAt } from "./MultiplierCurve.js";
import type { RoundState } from "./RoundState.js";
import type { Wallet } from "./Wallet.js";

/** D-11: compare multipliers only after hundredths rounding. */
function roundedMult(m: number): number {
  return fromMultHundredths(toMultHundredths(m));
}

export interface ResolveDeps {
  rng: Rng;
  wallet: Wallet;
  history: History;
}

function clampDt(dt: number): number {
  if (!Number.isFinite(dt) || dt <= 0) return 0;
  return Math.min(dt, CRASH_CONFIG.maxDeltaMs);
}

function enterWaiting(state: RoundState): RoundState {
  return {
    ...state,
    phase: "waiting",
    waitRemainingMs: CRASH_CONFIG.waitDurationMs,
    elapsedMs: 0,
    multiplier: 1,
    crashAt: null,
    lockedBetCents: null,
    cashOutRequested: false,
    // autoCashOutAt persists across rounds unless cleared by facade
  };
}

function startRound(state: RoundState, deps: ResolveDeps): RoundState {
  const crashAt = sampleCrashAt(deps.rng);
  return {
    ...state,
    phase: "flying",
    waitRemainingMs: 0,
    elapsedMs: 0,
    multiplier: 1,
    crashAt,
    roundId: state.roundId + 1,
    cashOutRequested: false,
  };
}

function settleOnce(
  state: RoundState,
  deps: ResolveDeps,
  terminalPhase: "crashed" | "cashed_out",
  settleMult: number,
): RoundState {
  if (state.settledRoundId === state.roundId) {
    return enterWaiting(state);
  }

  const crashAt = state.crashAt ?? settleMult;
  if (state.lockedBetCents != null && state.lockedBetCents > 0) {
    if (terminalPhase === "cashed_out") {
      const payout = payoutCents(
        state.lockedBetCents,
        toMultHundredths(settleMult),
      );
      deps.wallet.credit(payout);
    }
    // crash: stake already deducted on placeBet — no credit
  }

  deps.history.push(crashAt);

  return enterWaiting({
    ...state,
    phase: terminalPhase,
    multiplier: settleMult,
    settledRoundId: state.roundId,
    lockedBetCents: null,
    cashOutRequested: false,
  });
}

/**
 * Single settlement authority.
 * Order: clamp dt → waiting countdown → startRound (bet optional) →
 * flying → crash before auto CO before manual → settle → waiting (D-13).
 */
export function resolveTick(
  state: RoundState,
  dt: number,
  deps: ResolveDeps,
): RoundState {
  const step = clampDt(dt);

  if (state.phase === "cashed_out" || state.phase === "crashed") {
    return enterWaiting(state);
  }

  if (state.phase === "waiting") {
    const wait = state.waitRemainingMs - step;
    if (wait <= 0) {
      return startRound(state, deps);
    }
    return { ...state, waitRemainingMs: wait };
  }

  // flying
  if (state.crashAt == null) {
    return state;
  }

  const elapsed = state.elapsedMs + step;
  const m = roundedMult(multiplierAt(elapsed, CRASH_CONFIG.growthRatePerMs));
  const crashAt = roundedMult(state.crashAt);

  if (m >= crashAt) {
    return settleOnce(state, deps, "crashed", crashAt);
  }
  if (state.autoCashOutAt != null) {
    const autoAt = roundedMult(state.autoCashOutAt);
    if (m >= autoAt) {
      return settleOnce(state, deps, "cashed_out", autoAt);
    }
  }
  if (state.cashOutRequested) {
    return settleOnce(state, deps, "cashed_out", m);
  }

  return { ...state, elapsedMs: elapsed, multiplier: m };
}

/** Lock a stake onto waiting state (wallet already deducted by caller). */
export function attachBet(state: RoundState, betCents: Cents): RoundState {
  return { ...state, lockedBetCents: betCents };
}

export function markCashOutRequested(state: RoundState): RoundState {
  if (state.phase !== "flying") return state;
  return { ...state, cashOutRequested: true };
}

export function setAutoCashOutTarget(
  state: RoundState,
  target: number | null,
): RoundState {
  if (target == null) {
    return { ...state, autoCashOutAt: null };
  }
  if (!Number.isFinite(target)) {
    return state;
  }
  return { ...state, autoCashOutAt: roundedMult(target) };
}
