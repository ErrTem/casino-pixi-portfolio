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
    cashOutAt: null,
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
    cashOutAt: null,
    roundId: state.roundId + 1,
    cashOutRequested: false,
  };
}

/** Crash transition: push crashAt once, then waiting. No credit. */
function crashIntoWaiting(state: RoundState, deps: ResolveDeps, crashAt: number): RoundState {
  deps.history.push(crashAt);
  return enterWaiting({
    ...state,
    multiplier: crashAt,
    settledRoundId: state.roundId,
    lockedBetCents: null,
    cashOutRequested: false,
  });
}

/**
 * Flying → cashed_out: credit once, latch paid ×, keep climb until crashAt (D-16).
 * Does not push history and does not enterWaiting.
 */
function cashOutToSpectator(
  state: RoundState,
  deps: ResolveDeps,
  settleMult: number,
  elapsed: number,
  m: number,
): RoundState {
  if (state.settledRoundId !== state.roundId) {
    if (state.lockedBetCents != null && state.lockedBetCents > 0) {
      const payout = payoutCents(
        state.lockedBetCents,
        toMultHundredths(settleMult),
      );
      deps.wallet.credit(payout);
    }
  }

  return {
    ...state,
    phase: "cashed_out",
    elapsedMs: elapsed,
    multiplier: m,
    cashOutAt: settleMult,
    settledRoundId: state.roundId,
    lockedBetCents: null,
    cashOutRequested: false,
  };
}

/**
 * Single settlement authority.
 * Order: clamp dt → waiting countdown → startRound (bet optional) →
 * flying → crash before auto CO before manual → durable cashed_out climb →
 * crash into waiting (D-16).
 */
export function resolveTick(
  state: RoundState,
  dt: number,
  deps: ResolveDeps,
): RoundState {
  const step = clampDt(dt);

  // Non-durable crashed member: wipe if ever published (should not happen).
  if (state.phase === "crashed") {
    return enterWaiting(state);
  }

  if (state.phase === "waiting") {
    const wait = state.waitRemainingMs - step;
    if (wait <= 0) {
      return startRound(state, deps);
    }
    return { ...state, waitRemainingMs: wait };
  }

  // flying | cashed_out: advance multiplier the same way
  if (state.crashAt == null) {
    return state;
  }

  const elapsed = state.elapsedMs + step;
  const m = roundedMult(multiplierAt(elapsed, CRASH_CONFIG.growthRatePerMs));
  const crashAt = roundedMult(state.crashAt);

  if (state.phase === "cashed_out") {
    if (m >= crashAt) {
      return crashIntoWaiting(
        { ...state, elapsedMs: elapsed, multiplier: m },
        deps,
        crashAt,
      );
    }
    return { ...state, elapsedMs: elapsed, multiplier: m };
  }

  // flying
  if (m >= crashAt) {
    return crashIntoWaiting(
      { ...state, elapsedMs: elapsed, multiplier: m },
      deps,
      crashAt,
    );
  }
  if (state.autoCashOutAt != null) {
    const autoAt = roundedMult(state.autoCashOutAt);
    if (m >= autoAt) {
      return cashOutToSpectator(state, deps, autoAt, elapsed, m);
    }
  }
  if (state.cashOutRequested) {
    return cashOutToSpectator(state, deps, m, elapsed, m);
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
