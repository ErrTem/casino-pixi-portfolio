import type { AudioPort } from "../../../shared/audio/AudioPort.js";
import { saveMutePref } from "../../../shared/audio/mutePref.js";
import type {
  BetSlotId,
  BetSnap,
  CrashGame,
  CrashSnapshot,
} from "../logic/index.js";
import { CRASH_CONFIG } from "../logic/config.js";
import { clampAutoCashOut } from "./autoCashOut.js";
import { balanceTweenValue } from "./balanceTween.js";
import { clampStake, PRESET_CHIPS } from "./chips.js";
import { enablementFrom } from "./enablement.js";
import { formatMoney, formatMult } from "./format.js";
import { renderHistoryStrip } from "./historyStrip.js";
import { lastWinFromBets } from "./lastWin.js";
import { primaryChromeFrom } from "./primaryChrome.js";
import { sessionStatsFrom } from "./sessionStats.js";

const DISPLAY_MIN = CRASH_CONFIG.minBetCents / 100;
const DISPLAY_MAX = CRASH_CONFIG.maxBetCents / 100;
const STAKE_STEP = 10;
const AUTO_CO_STEP = 0.1;
/** balance count up duration on cash-out credit */
const BALANCE_TWEEN_MS = 750;

/** true when focus is in an editable control - keyboard cash-out must no op */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    return !target.readOnly && !target.disabled;
  }
  return target.tagName === "SELECT";
}

export interface CrashHud {
  render(snap: CrashSnapshot): void;
  /** session auto bet flag for a slot */
  isAutoBetOn(slot: BetSlotId): boolean;
  /** current stake from bet input for a slot */
  getStake(slot: BetSlotId): number;
  /**
   * clear auto bet on broke / insufficient_balance for a slot (or both)
   * syncs toggle UI and emphasizes reset, never calls resetWallet
   */
  stopAutoBet(slot: BetSlotId | "all", reason: string): void;
}

export interface MountCrashHudOptions {
  /** optional audioPort - mute + bet_lock when provided */
  audio?: AudioPort;
}

interface PanelEls {
  root: HTMLElement;
  slot: BetSlotId;
  bet: HTMLInputElement;
  auto: HTMLInputElement;
  autoToggle: HTMLInputElement;
  autoplayBtn: HTMLButtonElement;
  autoCoDec: HTMLButtonElement | null;
  autoCoInc: HTMLButtonElement | null;
  primary: HTMLButtonElement;
  primaryLabel: Element;
  primaryAmount: Element;
  stakeDec: HTMLButtonElement | null;
  stakeInc: HTMLButtonElement | null;
  chips: Element;
  chipButtons: HTMLButtonElement[];
  autoBetOn: boolean;
}

/**
 * thin HTML binder: commands in, snapshot fields out
 * dual bet panels; chips additive; auto CO per panel
 */
export function mountCrashHud(
  root: Element,
  game: CrashGame,
  options: MountCrashHudOptions = {},
): CrashHud {
  const audio = options.audio;

  const resetBtn = root.querySelector("[data-action=reset-wallet]");
  const muteBtn = root.querySelector<HTMLButtonElement>("[data-action=mute]");
  const statusEl = root.querySelector("[data-field=status]");
  const balanceEl = root.querySelector("[data-field=balance]");
  const lastWinEl = root.querySelector("[data-field=last-win]");
  const phaseEl = root.querySelector("[data-field=phase]");
  const liveMultEl = root.querySelector("[data-field=live-mult]");
  const historyHost = root.querySelector("[data-field=history]");
  const statAvgEl = root.querySelector("[data-field=stat-avg]");
  const statMaxEl = root.querySelector("[data-field=stat-max]");
  const shell =
    root.classList.contains("app-shell")
      ? root
      : (root.closest(".app-shell") ?? root);

  const panelRoots = Array.from(
    root.querySelectorAll<HTMLElement>(".bet-panel[data-slot]"),
  );

  if (
    !resetBtn ||
    !statusEl ||
    !balanceEl ||
    !lastWinEl ||
    !phaseEl ||
    !liveMultEl ||
    !historyHost ||
    !statAvgEl ||
    !statMaxEl ||
    panelRoots.length !== 2
  ) {
    throw new Error("CrashHud: required shell / #hud-bar fields missing");
  }

  if (audio && !muteBtn) {
    throw new Error("CrashHud: data-action=mute required when audio is provided");
  }

  const reset = resetBtn;
  const mute = muteBtn;
  const status = statusEl;
  const balance = balanceEl;
  const lastWin = lastWinEl;
  const phase = phaseEl;
  const liveMult = liveMultEl;
  const history = historyHost;
  const statAvg = statAvgEl;
  const statMax = statMaxEl;

  let lastPlaceReason: string | null = null;
  let lastSnap: CrashSnapshot | null = null;
  let prevBets: [BetSnap, BetSnap] | null = null;
  let displayedBalance = Number.NaN;
  let balanceTweenRaf = 0;
  let balanceTweenFrom = 0;
  let balanceTweenTo = 0;
  let balanceTweenStartMs = 0;

  function cancelBalanceTween(): void {
    if (balanceTweenRaf !== 0) {
      cancelAnimationFrame(balanceTweenRaf);
      balanceTweenRaf = 0;
    }
  }

  function setBalanceText(value: number): void {
    displayedBalance = value;
    balance.textContent = formatMoney(value);
  }

  function snapBalance(value: number): void {
    cancelBalanceTween();
    setBalanceText(value);
  }

  function stepBalanceTween(now: number): void {
    const elapsed = now - balanceTweenStartMs;
    const t = Math.min(1, Math.max(0, elapsed / BALANCE_TWEEN_MS));
    const value = balanceTweenValue(balanceTweenFrom, balanceTweenTo, t);
    setBalanceText(value);
    if (t < 1) {
      balanceTweenRaf = requestAnimationFrame(stepBalanceTween);
    } else {
      balanceTweenRaf = 0;
      setBalanceText(balanceTweenTo);
    }
  }

  function startBalanceTween(from: number, to: number): void {
    cancelBalanceTween();
    balanceTweenFrom = from;
    balanceTweenTo = to;
    balanceTweenStartMs = performance.now();
    balanceTweenRaf = requestAnimationFrame(stepBalanceTween);
  }

  function syncMuteLabel(): void {
    if (!mute || !audio) return;
    const muted = audio.isMuted();
    mute.textContent = muted ? "Sound: Off" : "Sound: On";
    mute.setAttribute("aria-pressed", muted ? "true" : "false");
  }

  function mountPanel(panelRoot: HTMLElement): PanelEls & {
    syncAutoCoFieldEnabled: () => void;
  } {
    const slotAttr = panelRoot.getAttribute("data-slot");
    const slot = (slotAttr === "1" ? 1 : 0) as BetSlotId;

    const betEl = panelRoot.querySelector<HTMLInputElement>(
      "[data-field=bet-input]",
    );
    const autoEl = panelRoot.querySelector<HTMLInputElement>(
      "[data-field=auto-co]",
    );
    const autoToggleEl = panelRoot.querySelector<HTMLInputElement>(
      "[data-field=auto-co-toggle]",
    );
    const autoplayBtnEl = panelRoot.querySelector<HTMLButtonElement>(
      "[data-action=autoplay]",
    );
    const primaryEl = panelRoot.querySelector<HTMLButtonElement>(
      "[data-action=primary]",
    );
    const primaryLabelEl = panelRoot.querySelector(
      "[data-field=primary-label]",
    );
    const primaryAmountEl = panelRoot.querySelector(
      "[data-field=primary-amount]",
    );
    const stakeDec = panelRoot.querySelector<HTMLButtonElement>(
      "[data-action=stake-dec]",
    );
    const stakeInc = panelRoot.querySelector<HTMLButtonElement>(
      "[data-action=stake-inc]",
    );
    const autoCoDec = panelRoot.querySelector<HTMLButtonElement>(
      "[data-action=auto-co-dec]",
    );
    const autoCoInc = panelRoot.querySelector<HTMLButtonElement>(
      "[data-action=auto-co-inc]",
    );
    const chipsEl = panelRoot.querySelector("[data-field=chips]");

    if (
      !betEl ||
      !autoEl ||
      !autoToggleEl ||
      !autoplayBtnEl ||
      !primaryEl ||
      !primaryLabelEl ||
      !primaryAmountEl ||
      !chipsEl
    ) {
      throw new Error(`CrashHud: panel slot ${slot} fields missing`);
    }

    const bet = betEl;
    const auto = autoEl;
    const autoToggle = autoToggleEl;
    const autoplayBtn = autoplayBtnEl;
    const primary = primaryEl;
    const primaryLabel = primaryLabelEl;
    const primaryAmount = primaryAmountEl;
    const chips = chipsEl;

    bet.min = String(DISPLAY_MIN);
    bet.max = String(DISPLAY_MAX);
    bet.step = "1";
    bet.inputMode = "numeric";

    const panel: PanelEls & { syncAutoCoFieldEnabled: () => void } = {
      root: panelRoot,
      slot,
      bet,
      auto,
      autoToggle,
      autoplayBtn,
      autoCoDec,
      autoCoInc,
      primary,
      primaryLabel,
      primaryAmount,
      stakeDec,
      stakeInc,
      chips,
      chipButtons: [],
      autoBetOn: false,
      syncAutoCoFieldEnabled: () => undefined,
    };

    function syncAutoplayUi(): void {
      autoplayBtn.setAttribute(
        "aria-pressed",
        panel.autoBetOn ? "true" : "false",
      );
      autoplayBtn.classList.toggle("autoplay-btn--on", panel.autoBetOn);
    }

    function syncAutoCoFieldEnabled(): void {
      const betSnap = lastSnap?.bets[slot];
      const canEditAuto =
        betSnap == null || enablementFrom(lastSnap!, betSnap).canEditAuto;
      const on = autoToggle.checked;
      const steppersOn = on && canEditAuto;
      autoToggle.disabled = !canEditAuto;
      auto.disabled = !steppersOn;
      if (autoCoDec) autoCoDec.disabled = !steppersOn;
      if (autoCoInc) autoCoInc.disabled = !steppersOn;
      auto.closest(".auto-co-stepper")?.classList.toggle("is-dimmed", !on);
      autoToggle.closest(".auto-toggle")?.classList.toggle("is-on", on);
    }
    panel.syncAutoCoFieldEnabled = syncAutoCoFieldEnabled;

    function applyAutoCoFromField(): void {
      if (!autoToggle.checked) {
        game.setAutoCashOut(slot, null);
        return;
      }
      const raw = auto.value.trim();
      if (raw === "") {
        game.setAutoCashOut(slot, null);
        return;
      }
      const clamped = clampAutoCashOut(Number(raw));
      auto.value = clamped.toFixed(2);
      game.setAutoCashOut(slot, clamped);
    }

    function applyStakeFromField(): void {
      bet.value = String(clampStake(Number(bet.value)));
    }

    // Quick-add chips: add to stake (not replace).
    for (const value of PRESET_CHIPS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = `+ ${value}`;
      btn.dataset.chip = String(value);
      btn.className = "chip";
      btn.addEventListener("click", () => {
        const current = Number(bet.value);
        const base = Number.isFinite(current) ? current : DISPLAY_MIN;
        bet.value = String(clampStake(base + value));
      });
      chips.appendChild(btn);
      panel.chipButtons.push(btn);
    }

    function tryPlaceBet(): void {
      applyStakeFromField();
      const amount = Number(bet.value);
      const result = game.placeBet(slot, amount);
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
      const betSnap = lastSnap.bets[slot];
      const en = enablementFrom(lastSnap, betSnap);
      if (en.canPlaceBet) {
        tryPlaceBet();
      } else if (en.canCancelBet) {
        const result = game.cancelBet(slot);
        if (!result.ok) {
          lastPlaceReason = result.reason;
          status.textContent = result.reason;
        } else {
          lastPlaceReason = null;
          status.textContent = "";
        }
      } else if (en.canCashOut) {
        audio?.unlock();
        game.requestCashOut(slot);
      }
    });

    autoToggle.addEventListener("change", () => {
      if (!autoToggle.checked) {
        game.setAutoCashOut(slot, null);
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

    bet.addEventListener("change", applyStakeFromField);
    bet.addEventListener("blur", applyStakeFromField);

    autoplayBtn.addEventListener("click", () => {
      panel.autoBetOn = !panel.autoBetOn;
      syncAutoplayUi();
    });

    function nudgeStake(delta: number): void {
      const current = Number(bet.value);
      const base = Number.isFinite(current) ? current : DISPLAY_MIN;
      bet.value = String(clampStake(base + delta));
    }

    function nudgeAutoCo(delta: number): void {
      if (!autoToggle.checked) return;
      const current = Number(auto.value);
      const base = Number.isFinite(current) && current > 0 ? current : 2;
      const next = clampAutoCashOut(base + delta);
      auto.value = next.toFixed(2);
      applyAutoCoFromField();
    }

    stakeDec?.addEventListener("click", () => nudgeStake(-STAKE_STEP));
    stakeInc?.addEventListener("click", () => nudgeStake(STAKE_STEP));
    autoCoDec?.addEventListener("click", () => nudgeAutoCo(-AUTO_CO_STEP));
    autoCoInc?.addEventListener("click", () => nudgeAutoCo(AUTO_CO_STEP));

    syncAutoCoFieldEnabled();
    syncAutoplayUi();
    return panel;
  }

  const panels = panelRoots.map(mountPanel);

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

  function stopAutoBet(slot: BetSlotId | "all", reason: string): void {
    const targets =
      slot === "all" ? panels : panels.filter((p) => p.slot === slot);
    for (const p of targets) {
      p.autoBetOn = false;
      p.autoplayBtn.setAttribute("aria-pressed", "false");
      p.autoplayBtn.classList.remove("autoplay-btn--on");
    }
    lastPlaceReason = reason;
    status.textContent = reason;
    shell.classList.toggle("hud-zone--broke", true);
    reset.classList.toggle("reset-demo--emphasize", true);
  }

  reset.addEventListener("click", () => {
    game.resetWallet();
    lastPlaceReason = null;
    status.textContent = "";
    lastWin.textContent = "-";
    cancelBalanceTween();
    // Next render snaps balance to reset wallet total.
  });

  // Space/Enter -> cash out all open flying slots; ignore while typing.
  window.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key !== " " && e.key !== "Enter") return;
    if (e.repeat) return;
    if (isEditableTarget(e.target)) return;
    if (!lastSnap) return;
    const anyCashable = lastSnap.bets.some(
      (b) => enablementFrom(lastSnap!, b).canCashOut,
    );
    if (!anyCashable) return;
    e.preventDefault();
    audio?.unlock();
    game.requestCashOutAll();
  });

  function render(snap: CrashSnapshot): void {
    lastSnap = snap;

    const payout = prevBets
      ? lastWinFromBets(prevBets, snap.bets)
      : null;
    if (payout != null) {
      lastWin.textContent = formatMoney(payout);
    }
    prevBets = [
      { ...snap.bets[0] },
      { ...snap.bets[1] },
    ];

    const targetBal = snap.balance;
    if (!Number.isFinite(displayedBalance)) {
      snapBalance(targetBal);
    } else if (targetBal > displayedBalance + 1e-9) {
      // Cash-out credit (or any rise) - count up.
      const from =
        balanceTweenRaf !== 0 ? displayedBalance : displayedBalance;
      startBalanceTween(from, targetBal);
    } else if (targetBal < displayedBalance - 1e-9) {
      // Debit / reset - snap instantly.
      snapBalance(targetBal);
    } else if (balanceTweenRaf === 0) {
      setBalanceText(targetBal);
    }

    phase.textContent = snap.phase;
    liveMult.textContent = formatMult(snap.multiplier);

    for (const panel of panels) {
      const betSnap = snap.bets[panel.slot];
      const stakeDisplay = Number(panel.bet.value);
      const stakeForChrome = Number.isFinite(stakeDisplay)
        ? stakeDisplay
        : DISPLAY_MIN;
      const chrome = primaryChromeFrom(snap, betSnap, stakeForChrome);
      panel.primaryLabel.textContent = chrome.label;
      panel.primaryAmount.textContent = chrome.amountLine;
      panel.primary.disabled = !chrome.enabled;
      panel.primary.classList.toggle("primary-cta--bet", chrome.kind === "bet");
      panel.primary.classList.toggle(
        "primary-cta--cancel",
        chrome.kind === "cancel",
      );
      panel.primary.classList.toggle(
        "primary-cta--cash-out",
        chrome.kind === "cash_out",
      );
      panel.primary.classList.toggle(
        "primary-cta--cashed-out",
        chrome.kind === "cashed_out",
      );

      if (
        panel.autoToggle.checked &&
        document.activeElement !== panel.auto
      ) {
        panel.auto.value =
          betSnap.autoCashOutAt == null ? "" : String(betSnap.autoCashOutAt);
      }

      const en = enablementFrom(snap, betSnap);
      panel.bet.disabled = !en.canEditBet;
      if (panel.stakeDec) panel.stakeDec.disabled = !en.canEditBet;
      if (panel.stakeInc) panel.stakeInc.disabled = !en.canEditBet;
      for (const btn of panel.chipButtons) {
        btn.disabled = !en.chipsEnabled;
      }
      panel.syncAutoCoFieldEnabled();
    }

    syncMuteLabel();
    renderHistoryStrip(history, snap.history);

    const stats = sessionStatsFrom(snap.history);
    statAvg.textContent = stats.avgLabel;
    statMax.textContent = stats.maxLabel;

    const emphasizeBroke =
      snap.balance < DISPLAY_MIN || lastPlaceReason === "broke";
    shell.classList.toggle("hud-zone--broke", emphasizeBroke);
    reset.classList.toggle("reset-demo--emphasize", emphasizeBroke);
    if (emphasizeBroke && !status.textContent) {
      status.textContent = "broke - Reset demo to continue";
    }
  }

  return {
    render,
    isAutoBetOn: (slot) =>
      panels.find((p) => p.slot === slot)?.autoBetOn ?? false,
    getStake: (slot) => {
      const panel = panels.find((p) => p.slot === slot);
      if (!panel) return DISPLAY_MIN;
      return clampStake(Number(panel.bet.value));
    },
    stopAutoBet,
  };
}
