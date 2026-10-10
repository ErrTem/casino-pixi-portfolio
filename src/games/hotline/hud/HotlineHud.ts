import type { AudioPort } from "../../../shared/audio/AudioPort.js";
import { saveMutePref } from "../../../shared/audio/mutePref.js";
import type { HotlineGame, HotlineSnapshot } from "../logic/index.js";
import { formatMoney } from "./format.js";
import { createLastWinTween } from "./lastWinTween.js";

export interface HotlineHud {
  render(snap: HotlineSnapshot): void;
  /** lock spin and bet steppers through flights and combo stub */
  setBusy(busy: boolean): void;
  /** combo strip copy via textContent only */
  setCombo(text: string): void;
  /** removes listeners */
  dispose(): void;
}

export interface MountHotlineHudOptions {
  audio?: AudioPort;
  /** number of selectable bet steps from config math.betStepsCents */
  betStepCount: number;
  /** count up time for the last win readout, 0 or missing shows it at once */
  lastWinTweenMs?: number;
  /** clock for the count up, defaults to performance.now */
  now?: () => number;
}

function need<T extends Element>(root: Element, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`hotline hud: ${selector} missing`);
  return el;
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
  // set while a count up is running, null once it lands or the win is hidden
  let tweenTarget: number | null = null;
  let tweenText = "";

  const balanceEl = need(root, "[data-field=balance]");
  const lastWinEl = need(root, "[data-field=last-win]");
  const betEl = need(root, "[data-field=bet]");
  const linesEl = need(root, "[data-field=lines]");
  const statusEl = need(root, "[data-field=status]");
  const comboEl = need(root, "[data-field=combo]");
  const spinBtn = need<HTMLButtonElement>(root, "[data-action=spin]");
  const decBtn = need<HTMLButtonElement>(root, "[data-action=bet-dec]");
  const incBtn = need<HTMLButtonElement>(root, "[data-action=bet-inc]");
  const muteBtn = root.querySelector<HTMLButtonElement>("[data-action=mute]");
  if (audio && !muteBtn) {
    throw new Error("hotline hud: [data-action=mute] missing");
  }

  let disposed = false;
  let busy = false;
  let lastSnap: HotlineSnapshot | null = null;

  function syncMuteLabel(): void {
    if (!muteBtn || !audio) return;
    const muted = audio.isMuted();
    muteBtn.textContent = muted ? "Sound: Off" : "Sound: On";
    muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
  }

  // last win text, counts up from zero once per settled spin
  function lastWinText(snap: HotlineSnapshot): string {
    if (snap.phase !== "settled") {
      tweenTarget = null;
      tweenText = "";
      return "-";
    }
    const target = Number.parseFloat(snap.lastWinDisplay);
    if (tweenMs <= 0 || !Number.isFinite(target) || target <= 0) {
      tweenTarget = null;
      return snap.lastWinDisplay;
    }
    const t = now();
    if (tweenText !== snap.lastWinDisplay) {
      tweenText = snap.lastWinDisplay;
      tweenTarget = target;
      lastWinTween.start(target, t);
    }
    if (tweenTarget === null || lastWinTween.isDone(t)) {
      tweenTarget = null;
      return snap.lastWinDisplay;
    }
    return formatMoney(lastWinTween.valueAt(t));
  }

  function syncControls(snap: HotlineSnapshot): void {
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
    balanceEl.textContent = snap.balanceDisplay;
    betEl.textContent = snap.betDisplay;
    linesEl.textContent = `${snap.paylineCount} lines`;
    lastWinEl.textContent = lastWinText(snap);
    syncControls(snap);
    syncMuteLabel();
  }

  const onSpin = (): void => {
    audio?.unlock();
    const result = game.spin();
    statusEl.textContent = result.ok ? "" : result.reason;
    render(game.getSnapshot());
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

  spinBtn.addEventListener("click", onSpin);
  decBtn.addEventListener("click", onDec);
  incBtn.addEventListener("click", onInc);
  muteBtn?.addEventListener("click", onMute);
  syncMuteLabel();

  return {
    render,
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
    },
    setCombo(text: string): void {
      if (disposed) return;
      comboEl.textContent = text;
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      spinBtn.removeEventListener("click", onSpin);
      decBtn.removeEventListener("click", onDec);
      incBtn.removeEventListener("click", onInc);
      muteBtn?.removeEventListener("click", onMute);
    },
  };
}
