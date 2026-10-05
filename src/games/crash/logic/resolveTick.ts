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
import {
  clearSlotsKeepAuto,
  emptyBetSlot,
  type BetSlot,
  type BetSlotId,
  type RoundState,
} from "./RoundState.js";
import type { Wallet } from "./Wallet.js";

/** compare multipliers only after hundredths rounding. */
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
    slots: clearSlotsKeepAuto(state.slots),
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
    // clear cashout request / prior settle flags; keep locked stakes + auto CO
    slots: [
      {
        ...state.slots[0],
        cashOutRequested: false,
        cashOutAt: null,
        settled: false,
      },
      {
        ...state.slots[1],
        cashOutRequested: false,
        cashOutAt: null,
        settled: false,
      },
    ],
  };
}

/** crash transition. push crashAt once then waiting. no credit */
function crashIntoWaiting(
  state: RoundState,
  deps: ResolveDeps,
  crashAt: number,
): RoundState {
  deps.history.push(crashAt);
  const waiting = enterWaiting({
    ...state,
    multiplier: crashAt,
    settledRoundId: state.roundId,
  });
  // pad wait so the view can hold "Crashed" + x for crashDisplayMs then full 5s countdown
  return {
    ...waiting,
    waitRemainingMs:
      CRASH_CONFIG.waitDurationMs + CRASH_CONFIG.crashDisplayMs,
  };
}

function creditSlot(
  slot: BetSlot,
  deps: ResolveDeps,
  settleMult: number,
): BetSlot {
  if (slot.settled) return slot;
  const stake = slot.lockedBetCents;
  if (stake != null && stake > 0) {
    const payout = payoutCents(stake, toMultHundredths(settleMult));
    deps.wallet.credit(payout);
  }
  return {
    ...slot,
    cashOutAt: settleMult,
    paidStakeCents: stake,
    lockedBetCents: null,
    cashOutRequested: false,
    settled: true,
  };
}

function loseSlot(slot: BetSlot): BetSlot {
  if (slot.settled || slot.lockedBetCents == null) return slot;
  return {
    ...slot,
    lockedBetCents: null,
    paidStakeCents: null,
    cashOutRequested: false,
    settled: true,
  };
}

/** mark open stakes lost on crash  */
function loseOpenSlots(slots: [BetSlot, BetSlot]): [BetSlot, BetSlot] {
  return [loseSlot(slots[0]), loseSlot(slots[1])];
}

/**
 * true when every slot that had skin in the game is settled via cashout
 * empty slots (never bet) do not block spectator cashed_out.
 */
function allActiveSlotsCashedOut(slots: readonly [BetSlot, BetSlot]): boolean {
  const active = slots.filter(
    (s) => s.lockedBetCents != null || s.cashOutAt != null,
  );
  if (active.length === 0) return false;
  return active.every((s) => s.settled && s.cashOutAt != null);
}

function settleSlotIfNeeded(
  slot: BetSlot,
  deps: ResolveDeps,
  m: number,
): BetSlot {
  if (slot.settled || slot.lockedBetCents == null) return slot;

  if (slot.autoCashOutAt != null) {
    const autoAt = roundedMult(slot.autoCashOutAt);
    if (m >= autoAt) {
      return creditSlot(slot, deps, autoAt);
    }
  }
  if (slot.cashOutRequested) {
    return creditSlot(slot, deps, m);
  }
  return slot;
}

/**
 * single settlement authority for dual slots
 * order: clamp dt -> waiting countdown -> startRound (bets optional) ->
 * flying -> crash before auto CO before manual per slot -> durable cashed_out
 * when all active slots cashed -> crash into waiting
 */
export function resolveTick(
  state: RoundState,
  dt: number,
  deps: ResolveDeps,
): RoundState {
  const step = clampDt(dt);

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

  if (state.crashAt == null) {
    return state;
  }

  const elapsed = state.elapsedMs + step;
  const m = roundedMult(multiplierAt(elapsed, CRASH_CONFIG.growthRatePerMs));
  const crashAt = roundedMult(state.crashAt);

  if (m >= crashAt) {
    return crashIntoWaiting(
      {
        ...state,
        elapsedMs: elapsed,
        multiplier: m,
        slots: loseOpenSlots(state.slots),
      },
      deps,
      crashAt,
    );
  }

  // per slot auto / manual cash-out (only while flying or still open)
  const slots: [BetSlot, BetSlot] = [
    settleSlotIfNeeded(state.slots[0], deps, m),
    settleSlotIfNeeded(state.slots[1], deps, m),
  ];

  const phase: RoundState["phase"] = allActiveSlotsCashedOut(slots)
    ? "cashed_out"
    : "flying";

  return {
    ...state,
    phase,
    elapsedMs: elapsed,
    multiplier: m,
    slots,
  };
}

/** lock a stake onto a waiting slot (wallet already deducted by caller) */
export function attachBet(
  state: RoundState,
  slot: BetSlotId,
  betCents: Cents,
): RoundState {
  if (state.phase !== "waiting") return state;
  const slots: [BetSlot, BetSlot] = [
    { ...state.slots[0] },
    { ...state.slots[1] },
  ];
  slots[slot] = {
    ...slots[slot],
    lockedBetCents: betCents,
    paidStakeCents: null,
    cashOutRequested: false,
    cashOutAt: null,
    settled: false,
  };
  return { ...state, slots };
}

/** clear locked stake on a waiting slot (wallet refund is caller's job) */
export function clearLockedBet(
  state: RoundState,
  slot: BetSlotId,
): RoundState {
  if (state.phase !== "waiting") return state;
  if (state.slots[slot].lockedBetCents == null) return state;
  const slots: [BetSlot, BetSlot] = [
    { ...state.slots[0] },
    { ...state.slots[1] },
  ];
  slots[slot] = {
    ...emptyBetSlot(),
    autoCashOutAt: slots[slot].autoCashOutAt,
  };
  return { ...state, slots };
}

export function markCashOutRequested(
  state: RoundState,
  slot: BetSlotId,
): RoundState {
  if (state.phase !== "flying" && state.phase !== "cashed_out") return state;
  const s = state.slots[slot];
  if (s.settled || s.lockedBetCents == null) return state;
  const slots: [BetSlot, BetSlot] = [
    { ...state.slots[0] },
    { ...state.slots[1] },
  ];
  slots[slot] = { ...slots[slot], cashOutRequested: true };
  return { ...state, slots };
}

export function setAutoCashOutTarget(
  state: RoundState,
  slot: BetSlotId,
  target: number | null,
): RoundState {
  const slots: [BetSlot, BetSlot] = [
    { ...state.slots[0] },
    { ...state.slots[1] },
  ];
  if (target == null) {
    slots[slot] = { ...slots[slot], autoCashOutAt: null };
    return { ...state, slots };
  }
  if (!Number.isFinite(target)) {
    return state;
  }
  const clamped = Math.min(
    CRASH_CONFIG.crashCap,
    Math.max(CRASH_CONFIG.crashFloor, roundedMult(target)),
  );
  slots[slot] = { ...slots[slot], autoCashOutAt: clamped };
  return { ...state, slots };
}

/** First non-null slot cashOutAt for theater / SFX. */
export function firstCashOutAt(
  slots: readonly [BetSlot, BetSlot],
): number | null {
  return slots[0].cashOutAt ?? slots[1].cashOutAt ?? null;
}
