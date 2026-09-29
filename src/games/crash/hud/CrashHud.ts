import type { AudioPort } from "../../../shared/audio/AudioPort.js";
import { saveMutePref } from "../../../shared/audio/mutePref.js";
import type { CrashGame, CrashSnapshot } from "../logic/index.js";
import { CRASH_CONFIG } from "../logic/config.js";
import {
  ALL_CHIP,
  PRESET_CHIPS,
  maxAffordableStake,
} from "./chips.js";
import { enablementFrom } from "./enablement.js";
import { formatMoney, formatMult } from "./format.js";
import { renderHistoryStrip } from "./historyStrip.js";
import { primaryChromeFrom } from "./primaryChrome.js";
import { sessionStatsFrom } from "./sessionStats.js";

const DISPLAY_MIN = CRASH_CONFIG.minBetCents / 100;
const STAKE_STEP = 10;
const AUTO_CO_STEP = 0.1;

/** True when focus is in an editable control — keyboard cash-out must no-op (D-15). */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export interface CrashHud {
  render(snap: CrashSnapshot): void;
  /** Session Auto bet flag (D-10). */
  isAutoBetOn(): boolean;
  /** Current stake from bet input (display units) — next auto-place (D-13). */
  getStake(): number;
  /**
   * Clear Auto bet on broke / insufficient_balance (D-12).
   * Syncs toggle UI and emphasizes Reset — never calls resetWallet.
   */
  stopAutoBet(reason: string): void;
}

export interface MountCrashHudOptions {
  /** Optional AudioPort — mute + bet_lock when provided (05-02). */
  audio?: AudioPort;
}

/**
 * Thin HTML binder: commands in, snapshot fields out.
 * Single dual-line primary (D-06..D-09); chips fill-only (D-03); Auto CO toggle (D-04).
 * Silent ?seed= boot stays in main.ts — no Seed chip / on-screen seed (D-21..D-24).
 */
export function mountCrashHud(
  root: Element,
  game: CrashGame,
  options: MountCrashHudOptions = {},
): CrashHud {
  const audio = options.audio;

  const betInput = root.querySelector<HTMLInputElement>(
    "[data-field=bet-input]",
  );
  const autoInput = root.querySelector<HTMLInputElement>(
    "[data-field=auto-co]",
  );
  const autoCoToggle = root.querySelector<HTMLInputElement>(
    "[data-field=auto-co-toggle]",
  );
  const autoBetToggle = root.querySelector<HTMLInputElement>(
    "[data-field=auto-bet-toggle]",
  );
  const primaryBtn = root.querySelector<HTMLButtonElement>(
    "[data-action=primary]",
  );
  const primaryLabelEl = root.querySelector("[data-field=primary-label]");
  const primaryAmountEl = root.querySelector("[data-field=primary-amount]");
  const resetBtn = root.querySelector("[data-action=reset-wallet]");
  const muteBtn = root.querySelector<HTMLButtonElement>("[data-action=mute]");
  const stakeDecBtn = root.querySelector<HTMLButtonElement>(
    "[data-action=stake-dec]",
  );
  const stakeIncBtn = root.querySelector<HTMLButtonElement>(
    "[data-action=stake-inc]",
  );
  const autoCoDecBtn = root.querySelector<HTMLButtonElement>(
    "[data-action=auto-co-dec]",
  );
  const autoCoIncBtn = root.querySelector<HTMLButtonElement>(
    "[data-action=auto-co-inc]",
  );
  const statusEl = root.querySelector("[data-field=status]");
  const balanceEl = root.querySelector("[data-field=balance]");
  const phaseEl = root.querySelector("[data-field=phase]");
  const liveMultEl = root.querySelector("[data-field=live-mult]");
  const chipsHost = root.querySelector("[data-field=chips]");
  const historyHost = root.querySelector("[data-field=history]");
  const statAvgEl = root.querySelector("[data-field=stat-avg]");
  const statMaxEl = root.querySelector("[data-field=stat-max]");
  const shell =
    root.classList.contains("app-shell")
      ? root
      : (root.closest(".app-shell") ?? root);

  if (
    !betInput ||
    !autoInput ||
    !autoCoToggle ||
    !primaryBtn ||
    !primaryLabelEl ||
    !primaryAmountEl ||
    !resetBtn ||
    !statusEl ||
    !balanceEl ||
    !phaseEl ||
    !liveMultEl ||
    !chipsHost ||
    !historyHost ||
    !statAvgEl ||
    !statMaxEl
  ) {
    throw new Error("CrashHud: required shell / #hud-bar fields missing");
  }

  if (audio && !muteBtn) {
    throw new Error("CrashHud: data-action=mute required when audio is provided");
  }

  const bet = betInput;
  const auto = autoInput;
  const autoToggle = autoCoToggle;
  const primary = primaryBtn;
  const primaryLabel = primaryLabelEl;
  const primaryAmount = primaryAmountEl;
  const reset = resetBtn;
  const mute = muteBtn;
  const status = statusEl;
  const balance = balanceEl;
  const phase = phaseEl;
  const liveMult = liveMultEl;
  const chips = chipsHost;
  const history = historyHost;
  const statAvg = statAvgEl;
  const statMax = statMaxEl;

  let lastPlaceReason: string | null = null;
  let lastSnap: CrashSnapshot | null = null;
  let autoBetOn = false;

  function syncMuteLabel(): void {
    if (!mute || !audio) return;
    const muted = audio.isMuted();
    mute.textContent = muted ? "Sound: Off" : "Sound: On";
    mute.setAttribute("aria-pressed", muted ? "true" : "false");
  }

  function syncAutoCoFieldEnabled(): void {
    const on = autoToggle.checked;
    auto.disabled = !on;
    if (autoCoDecBtn) autoCoDecBtn.disabled = !on;
    if (autoCoIncBtn) autoCoIncBtn.disabled = !on;
    auto.closest(".auto-co-stepper")?.classList.toggle("is-dimmed", !on);
  }

  function applyAutoCoFromField(): void {
    if (!autoToggle.checked) {
      game.setAutoCashOut(null);
      return;
    }
    const raw = auto.value.trim();
    if (raw === "") game.setAutoCashOut(null);
    else game.setAutoCashOut(Number(raw));
  }

  // Chips: fill bet-input only — never call placeBet (Pitfall 4 / WALT-03 / D-03).
  const chipButtons: HTMLButtonElement[] = [];
  for (const value of PRESET_CHIPS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = String(value);
    btn.dataset.chip = String(value);
    btn.className = "chip";
    btn.addEventListener("click", () => {
      bet.value = String(value);
      syncChipSelection();
    });
    chips.appendChild(btn);
    chipButtons.push(btn);
  }

  const allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.textContent = ALL_CHIP;
  allBtn.dataset.chip = ALL_CHIP;
  allBtn.className = "chip";
  allBtn.addEventListener("click", () => {
    if (!lastSnap) return;
    const max = maxAffordableStake(lastSnap.balance);
    if (max < DISPLAY_MIN) return;
    bet.value = String(max);
    syncChipSelection();
  });
  chips.appendChild(allBtn);
  chipButtons.push(allBtn);

  function syncChipSelection(): void {
    const current = bet.value;
    for (const btn of chipButtons) {
      btn.classList.toggle("chip--selected", btn.dataset.chip === current);
    }
  }

  function tryPlaceBet(): void {
    const amount = Number(bet.value);
    const result = game.placeBet(amount);
    if (!result.ok) {
      lastPlaceReason = result.reason;
      status.textContent = result.reason;
    } else {
      lastPlaceReason = null;
      status.textContent = "";
      if (audio) {
        audio.unlock();
        audio.play("bet_lock");
      }
    }
  }

  primary.addEventListener("click", () => {
    if (!lastSnap) return;
    const en = enablementFrom(lastSnap);
    if (en.canPlaceBet) {
      tryPlaceBet();
    } else if (en.canCashOut) {
      audio?.unlock();
      game.requestCashOut();
    }
  });

  if (mute && audio) {
    mute.addEventListener("click", () => {
      audio.unlock();
      const next = !audio.isMuted();
      audio.setMuted(next);
      saveMutePref(next);
      syncMuteLabel();
    });
    syncMuteLabel();
  }

  autoToggle.addEventListener("change", () => {
    if (!autoToggle.checked) {
      game.setAutoCashOut(null);
      syncAutoCoFieldEnabled();
      return;
    }
    syncAutoCoFieldEnabled();
    if (auto.value.trim() === "") {
      auto.value = "2.00";
    }
    applyAutoCoFromField();
  });

  auto.addEventListener("change", applyAutoCoFromField);
  auto.addEventListener("blur", applyAutoCoFromField);

  if (autoBetToggle) {
    autoBetToggle.addEventListener("change", () => {
      autoBetOn = autoBetToggle.checked;
    });
  }

  function stopAutoBet(reason: string): void {
    autoBetOn = false;
    if (autoBetToggle) autoBetToggle.checked = false;
    lastPlaceReason = reason;
    status.textContent = reason;
    shell.classList.toggle("hud-zone--broke", true);
    reset.classList.toggle("reset-demo--emphasize", true);
  }

  function nudgeStake(delta: number): void {
    const current = Number(bet.value);
    const base = Number.isFinite(current) ? current : DISPLAY_MIN;
    const next = Math.max(DISPLAY_MIN, Math.floor(base + delta));
    bet.value = String(next);
    syncChipSelection();
  }

  function nudgeAutoCo(delta: number): void {
    if (!autoToggle.checked) return;
    const current = Number(auto.value);
    const base = Number.isFinite(current) && current > 0 ? current : 2;
    const next = Math.max(1.01, Math.round((base + delta) * 100) / 100);
    auto.value = String(next);
    applyAutoCoFromField();
  }

  stakeDecBtn?.addEventListener("click", () => nudgeStake(-STAKE_STEP));
  stakeIncBtn?.addEventListener("click", () => nudgeStake(STAKE_STEP));
  autoCoDecBtn?.addEventListener("click", () => nudgeAutoCo(-AUTO_CO_STEP));
  autoCoIncBtn?.addEventListener("click", () => nudgeAutoCo(AUTO_CO_STEP));

  reset.addEventListener("click", () => {
    game.resetWallet();
    lastPlaceReason = null;
    status.textContent = "";
  });

  bet.addEventListener("input", syncChipSelection);
  syncChipSelection();
  syncAutoCoFieldEnabled();

  // Space/Enter → same requestCashOut as primary; ignore while typing (D-05 / PLSH-05).
  window.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key !== " " && e.key !== "Enter") return;
    if (e.repeat) return;
    if (isEditableTarget(e.target)) return;
    if (!lastSnap || !enablementFrom(lastSnap).canCashOut) return;
    e.preventDefault();
    audio?.unlock();
    game.requestCashOut();
  });

  function render(snap: CrashSnapshot): void {
    lastSnap = snap;
    balance.textContent = formatMoney(snap.balance);
    phase.textContent = snap.phase;
    liveMult.textContent = formatMult(snap.multiplier);

    const stakeDisplay = Number(bet.value);
    const stakeForChrome = Number.isFinite(stakeDisplay)
      ? stakeDisplay
      : DISPLAY_MIN;
    const chrome = primaryChromeFrom(snap, stakeForChrome);
    primaryLabel.textContent = chrome.label;
    primaryAmount.textContent = chrome.amountLine;
    primary.disabled = !chrome.enabled;

    // Sync Auto CO field from snapshot when toggle ON and field not focused.
    if (autoToggle.checked && document.activeElement !== auto) {
      auto.value =
        snap.autoCashOutAt == null ? "" : String(snap.autoCashOutAt);
    }

    const en = enablementFrom(snap);
    bet.disabled = !en.canEditBet;
    if (stakeDecBtn) stakeDecBtn.disabled = !en.canEditBet;
    if (stakeIncBtn) stakeIncBtn.disabled = !en.canEditBet;

    const allMax = maxAffordableStake(snap.balance);
    const allAffordable = allMax >= DISPLAY_MIN;
    for (const btn of chipButtons) {
      if (btn.dataset.chip === ALL_CHIP) {
        btn.disabled = !en.chipsEnabled || !allAffordable;
      } else {
        btn.disabled = !en.chipsEnabled;
      }
    }
    syncChipSelection();
    syncMuteLabel();
    syncAutoCoFieldEnabled();

    renderHistoryStrip(history, snap.history);

    const stats = sessionStatsFrom(snap.history);
    statAvg.textContent = stats.avgLabel;
    statMax.textContent = stats.maxLabel;

    const emphasizeBroke = en.showBroke || lastPlaceReason === "broke";
    shell.classList.toggle("hud-zone--broke", emphasizeBroke);
    reset.classList.toggle("reset-demo--emphasize", emphasizeBroke);
    if (emphasizeBroke && !status.textContent) {
      status.textContent = "broke — Reset demo to continue";
    }
  }

  return {
    render,
    isAutoBetOn: () => autoBetOn,
    getStake: () => {
      const n = Number(bet.value);
      return Number.isFinite(n) ? n : DISPLAY_MIN;
    },
    stopAutoBet,
  };
}
