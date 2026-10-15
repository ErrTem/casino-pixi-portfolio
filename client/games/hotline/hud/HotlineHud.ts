import type { AudioPort } from "../../../shared/audio/AudioPort.js";
import { saveMutePref } from "../../../shared/audio/mutePref.js";
import type {
  HotlineGame,
  HotlineSnapshot,
  SpinResult,
} from "../../../../math/hotline/index.js";
import type { ComboStripCell } from "./comboStripModel.js";
import { formatMoney } from "./format.js";
import { createLastWinTween } from "./lastWinTween.js";

export interface HotlineHud {
  render(snap: HotlineSnapshot): void;
  /** lock spin gamble and bet steppers through flights and combo stub, info stays on */
  setBusy(busy: boolean): void;
  /** gamble stays off by default, busy still locks it when enabled */
  setGambleEnabled(enabled: boolean): void;
  /** combo strip copy via textContent only */
  setCombo(text: string): void;
  /** highlighted night path cells via createElement spans */
  setComboPath(cells: readonly ComboStripCell[]): void;
  /** free spins remaining line via textContent only */
  setFeatureLine(text: string): void;
  /** same path as the spin button, auto spin calls this from the session */
  requestSpin(): SpinResult;
  /** sets the auto button state without firing onAutoChange */
  setAuto(on: boolean): void;
  /** removes listeners */
  dispose(): void;
}

export interface MountHotlineHudOptions {
  audio?: AudioPort;
  /** number of selectable bet steps from config math.betStepsCents */
  betStepCount: number;
  /** count up time for the last win readout, 0 or missing shows it at once */
  lastWinTweenMs?: number;
  /** gamble button click, the session owns the overlay and the round */
  onGamble?: () => void;
  /** info button click, the session owns the rules sheet and the pause */
  onInfo?: () => void;
  /** turbo button click, the session speeds up reels and the win cycle */
  onTurboChange?: (on: boolean) => void;
  /** auto button click, the session owns the spin loop */
  onAutoChange?: (on: boolean) => void;
  /** clock for the count up, defaults to performance.now */
  now?: () => number;
}

function need<T extends Element>(root: Element, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`hotline hud: ${selector} missing`);
  return el;
}

/** true when focus is in an editable control - keyboard spin must no op */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") return false;
  const el = target as {
    isContentEditable?: boolean;
    tagName?: string;
    readOnly?: boolean;
    disabled?: boolean;
  };
  if (el.isContentEditable) return true;
  const tag = typeof el.tagName === "string" ? el.tagName.toUpperCase() : "";
  if (tag === "INPUT" || tag === "TEXTAREA") {
    return !el.readOnly && !el.disabled;
  }
  return tag === "SELECT";
}

/** base line total, or fs cumulative while night free spins are open */
function settleWinDisplay(snap: HotlineSnapshot): string {
  if (snap.night?.fs) {
    return formatMoney(snap.night.fs.totalCents / 100);
  }
  return snap.lastWinDisplay;
}

// thin html binder: commands in, snapshot text out
export function mountHotlineHud(
  root: Element,
  game: HotlineGame,
  options: MountHotlineHudOptions,
): HotlineHud {
  const { audio, betStepCount } = options;
  const tweenMs = options.lastWinTweenMs ?? 0;
  const now = options.now ?? (() => performance.now());
  const lastWinTween = createLastWinTween(tweenMs);
  // set while a count up is running, null once it lands
  let tweenTarget: number | null = null;
  let tweenText = "";
  // sticky last win: start at 0.00, only advance on a positive settle
  let stickyLastWin = "0.00";

  const balanceEl = need(root, "[data-field=balance]");
  const lastWinEl = need(root, "[data-field=last-win]");
  lastWinEl.textContent = stickyLastWin;
  const betEl = need(root, "[data-field=bet]");
  const statusEl = need(root, "[data-field=status]");
  const comboEl = need(root, "[data-field=combo]");
  const featureEl = need(root, "[data-field=feature]");
  const spinBtn = need<HTMLButtonElement>(root, "[data-action=spin]");
  const decBtn = need<HTMLButtonElement>(root, "[data-action=bet-dec]");
  const incBtn = need<HTMLButtonElement>(root, "[data-action=bet-inc]");
  const gambleBtn = need<HTMLButtonElement>(root, "[data-action=gamble]");
  // info is never locked by busy, the rules sheet may open any time
  const infoBtn = need<HTMLButtonElement>(root, "[data-action=info]");
  // turbo and auto stay live while busy so the player can stop auto mid spin
  const turboBtn = need<HTMLButtonElement>(root, "[data-action=turbo]");
  const autoBtn = need<HTMLButtonElement>(root, "[data-action=auto]");
  const muteBtn = root.querySelector<HTMLButtonElement>("[data-action=mute]");
  if (audio && !muteBtn) {
    throw new Error("hotline hud: [data-action=mute] missing");
  }

  let disposed = false;
  let busy = false;
  let gambleEnabled = false;
  let turboOn = false;
  let autoOn = false;
  let lastSnap: HotlineSnapshot | null = null;
  // balance shown in the chrome, may lag snap while a win chip flies
  let shownBalance = "";
  let flyChip: HTMLElement | null = null;
  let flyTimer: ReturnType<typeof setTimeout> | null = null;
  let pulseTimer: ReturnType<typeof setTimeout> | null = null;
  const FLY_MS = 500;
  const PULSE_MS = 550;
  const PULSE_CLASS = "top-chrome__balance--pulse";

  function balanceHost(): Element | null {
    return (
      balanceEl.closest?.(".top-chrome__balance") ??
      balanceEl.parentElement
    );
  }

  function clearWinFly(): void {
    if (flyTimer != null) {
      clearTimeout(flyTimer);
      flyTimer = null;
    }
    if (pulseTimer != null) {
      clearTimeout(pulseTimer);
      pulseTimer = null;
    }
    if (flyChip) {
      flyChip.remove();
      flyChip = null;
    }
    const host = balanceHost();
    host?.classList.remove(PULSE_CLASS);
  }

  function startWinFly(winText: string, nextBalance: string): void {
    if (typeof document === "undefined") {
      balanceEl.textContent = nextBalance;
      shownBalance = nextBalance;
      return;
    }
    clearWinFly();
    const fromEl = lastWinEl;
    const host = balanceHost();
    const from = fromEl.getBoundingClientRect?.();
    const to = host?.getBoundingClientRect?.();
    if (!from || !to || !host) {
      balanceEl.textContent = nextBalance;
      shownBalance = nextBalance;
      return;
    }
    const chip = document.createElement("span");
    chip.className = "hotline-win-fly";
    chip.textContent = winText;
    const startX = from.left + from.width / 2;
    const startY = from.top + from.height / 2;
    const endX = to.left + to.width / 2;
    const endY = to.top + to.height / 2;
    chip.style.left = `${startX}px`;
    chip.style.top = `${startY}px`;
    chip.style.transform = "translate(-50%, -50%)";
    chip.style.opacity = "1";
    document.body.appendChild(chip);
    flyChip = chip;
    // next frame so the transition runs from the start point
    requestAnimationFrame(() => {
      if (disposed || flyChip !== chip) return;
      chip.style.transform = `translate(calc(-50% + ${endX - startX}px), calc(-50% + ${endY - startY}px))`;
      chip.style.opacity = "0.35";
    });
    flyTimer = setTimeout(() => {
      flyTimer = null;
      if (disposed) return;
      if (flyChip === chip) {
        chip.remove();
        flyChip = null;
      }
      balanceEl.textContent = nextBalance;
      shownBalance = nextBalance;
      host.classList.add(PULSE_CLASS);
      const onEnd = (): void => {
        host.removeEventListener("animationend", onEnd);
        host.classList.remove(PULSE_CLASS);
      };
      host.addEventListener("animationend", onEnd);
      pulseTimer = setTimeout(() => {
        pulseTimer = null;
        host.removeEventListener("animationend", onEnd);
        host.classList.remove(PULSE_CLASS);
      }, PULSE_MS);
    }, FLY_MS);
  }

  function syncMuteLabel(): void {
    if (!muteBtn || !audio) return;
    const muted = audio.isMuted();
    muteBtn.textContent = muted ? "Sound: Off" : "Sound: On";
    muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
  }

  // sticky last win: keep prior amount while spinning or on a blank settle
  function lastWinText(snap: HotlineSnapshot): string {
    if (snap.phase !== "settled") {
      // clear settle id so the next land restarts even for the same total
      tweenTarget = null;
      tweenText = "";
      return stickyLastWin;
    }
    const display = settleWinDisplay(snap);
    const target = Number.parseFloat(display);
    if (!Number.isFinite(target) || target <= 0) {
      tweenTarget = null;
      return stickyLastWin;
    }
    if (tweenMs <= 0) {
      stickyLastWin = display;
      tweenTarget = null;
      return stickyLastWin;
    }
    const t = now();
    // settle id includes balance so a same-total re-spin still refreshes
    const settleId = `${display}@${snap.balanceDisplay}`;
    if (tweenText !== settleId) {
      tweenText = settleId;
      tweenTarget = target;
      // commit sticky up front so an idle interrupt keeps the settle total
      stickyLastWin = display;
      lastWinTween.start(target, t);
    }
    if (tweenTarget === null || lastWinTween.isDone(t)) {
      stickyLastWin = display;
      tweenTarget = null;
      return stickyLastWin;
    }
    return formatMoney(lastWinTween.valueAt(t));
  }

  function syncGamble(): void {
    gambleBtn.disabled = busy || !gambleEnabled;
  }

  function syncControls(snap: HotlineSnapshot): void {
    syncGamble();
    if (busy) {
      spinBtn.disabled = true;
      decBtn.disabled = true;
      incBtn.disabled = true;
      return;
    }
    spinBtn.disabled = false;
    decBtn.disabled = snap.betStepIndex <= 0;
    incBtn.disabled = snap.betStepIndex >= betStepCount - 1;
  }

  function render(snap: HotlineSnapshot): void {
    if (disposed) return;
    lastSnap = snap;
    betEl.textContent = snap.betDisplay;
    lastWinEl.textContent = lastWinText(snap);

    const nextBal = snap.balanceDisplay;
    const prevBal = shownBalance || balanceEl.textContent || "";
    const prevNum = Number.parseFloat(prevBal);
    const nextNum = Number.parseFloat(nextBal);
    const winText = settleWinDisplay(snap);
    const winNum = Number.parseFloat(winText);
    const shouldFly =
      snap.phase === "settled" &&
      Number.isFinite(winNum) &&
      winNum > 0 &&
      Number.isFinite(prevNum) &&
      Number.isFinite(nextNum) &&
      nextNum > prevNum &&
      !flyChip;

    if (shouldFly) {
      // keep showing the pre-credit balance until the chip lands
      balanceEl.textContent = prevBal;
      shownBalance = prevBal;
      startWinFly(winText, nextBal);
    } else if (!flyChip) {
      balanceEl.textContent = nextBal;
      shownBalance = nextBal;
    }

    syncControls(snap);
    syncMuteLabel();
  }

  function requestSpin(): SpinResult {
    if (disposed) return { ok: false, reason: "" };
    audio?.unlock();
    const result = game.spin();
    statusEl.textContent = result.ok ? "" : result.reason;
    render(game.getSnapshot());
    return result;
  }
  const onSpin = (): void => {
    requestSpin();
  };

  const onTurboClick = (): void => {
    if (disposed) return;
    audio?.unlock();
    turboOn = !turboOn;
    turboBtn.setAttribute("aria-pressed", turboOn ? "true" : "false");
    options.onTurboChange?.(turboOn);
  };

  const onAutoClick = (): void => {
    if (disposed) return;
    audio?.unlock();
    autoOn = !autoOn;
    autoBtn.setAttribute("aria-pressed", autoOn ? "true" : "false");
    options.onAutoChange?.(autoOn);
  };

  // bet steps only move through config indexes, the game clamps the rest
  const nudgeBet = (delta: number): void => {
    const current = game.getSnapshot().betStepIndex;
    game.setBetStepIndex(current + delta);
    render(game.getSnapshot());
  };
  const onDec = (): void => nudgeBet(-1);
  const onInc = (): void => nudgeBet(1);

  const onMute = (): void => {
    if (!audio) return;
    audio.unlock();
    const next = !audio.isMuted();
    audio.setMuted(next);
    saveMutePref(next);
    syncMuteLabel();
  };

  const onGambleClick = (): void => {
    if (disposed || gambleBtn.disabled) return;
    options.onGamble?.();
  };

  const onInfoClick = (): void => {
    if (disposed) return;
    options.onInfo?.();
  };

  // Space/Enter -> same path as the spin button; ignore while typing or busy
  const onKeydown = (e: KeyboardEvent): void => {
    if (e.key !== " " && e.key !== "Enter") return;
    if (e.repeat) return;
    if (isEditableTarget(e.target)) return;
    if (disposed || spinBtn.disabled) return;
    e.preventDefault();
    requestSpin();
  };
  // node vitest has no window unless a test stubs one
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", onKeydown);
  }

  spinBtn.addEventListener("click", onSpin);
  decBtn.addEventListener("click", onDec);
  incBtn.addEventListener("click", onInc);
  gambleBtn.addEventListener("click", onGambleClick);
  infoBtn.addEventListener("click", onInfoClick);
  turboBtn.addEventListener("click", onTurboClick);
  autoBtn.addEventListener("click", onAutoClick);
  muteBtn?.addEventListener("click", onMute);
  gambleBtn.disabled = true;
  syncMuteLabel();

  return {
    render,
    requestSpin,
    setAuto(next: boolean): void {
      if (disposed) return;
      autoOn = next;
      autoBtn.setAttribute("aria-pressed", next ? "true" : "false");
    },
    setBusy(next: boolean): void {
      if (disposed) return;
      busy = next;
      if (lastSnap) {
        syncControls(lastSnap);
        return;
      }
      spinBtn.disabled = busy;
      decBtn.disabled = busy;
      incBtn.disabled = busy;
      syncGamble();
    },
    setGambleEnabled(next: boolean): void {
      if (disposed) return;
      gambleEnabled = next;
      syncGamble();
    },
    setCombo(text: string): void {
      if (disposed) return;
      comboEl.replaceChildren();
      comboEl.textContent = text;
    },
    setComboPath(cells: readonly ComboStripCell[]): void {
      if (disposed) return;
      comboEl.replaceChildren();
      if (cells.length === 0) {
        comboEl.textContent = "";
        return;
      }
      const nodes: HTMLElement[] = [];
      cells.forEach((cell, index) => {
        if (index > 0) {
          const joiner = document.createElement("span");
          joiner.className = "hotline-combo-joiner";
          joiner.textContent = " → ";
          nodes.push(joiner);
        }
        const span = document.createElement("span");
        const mods =
          cell.state === "active"
            ? " hotline-combo-step active"
            : cell.state === "done"
              ? " hotline-combo-step done"
              : " hotline-combo-step";
        span.className = mods.trim();
        span.textContent = cell.label;
        nodes.push(span);
      });
      comboEl.replaceChildren(...nodes);
    },
    setFeatureLine(text: string): void {
      if (disposed) return;
      featureEl.textContent = text;
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      clearWinFly();
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", onKeydown);
      }
      spinBtn.removeEventListener("click", onSpin);
      decBtn.removeEventListener("click", onDec);
      incBtn.removeEventListener("click", onInc);
      gambleBtn.removeEventListener("click", onGambleClick);
      infoBtn.removeEventListener("click", onInfoClick);
      turboBtn.removeEventListener("click", onTurboClick);
      autoBtn.removeEventListener("click", onAutoClick);
      muteBtn?.removeEventListener("click", onMute);
    },
  };
}
