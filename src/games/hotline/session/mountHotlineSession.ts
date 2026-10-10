import type { Ticker } from "pixi.js";
import type { GameSession, ShellContext } from "../../../shell/types.js";
import { loadHotlineConfig } from "../config/loadHotlineConfig.js";
import { buildComboStripCells } from "../hud/comboStripModel.js";
import { mountFeatureOverlay } from "../hud/FeatureOverlay.js";
import { mountHotlineHud } from "../hud/HotlineHud.js";
import type {
  CollectorOutcome,
  CollectorSpawn,
} from "../logic/collectors/resolveCollectors.js";
import {
  TOKEN_COLOR_ORDER,
  type TokenColor,
} from "../logic/collectors/TokenColors.js";
import {
  createHotlineGame,
  type HotlineGame,
  type HotlineSnapshot,
  type NightStep,
  type SpinResult,
} from "../logic/index.js";
import { DEFAULT_WIN_CYCLE_MS } from "../view/WinLinesOverlay.js";
import { mountHotlineView } from "../view/mountHotlineView.js";
import {
  baselineFromMeterFills,
  formatComboStrip,
  formatFeatureLine,
  progressiveDisplayFills,
  type MeterBaseline,
} from "./collectPresentation.js";

const LAST_WIN_TWEEN_MS = 900;
const FS_WIN_CYCLE_MS = 480;
const FS_GAP_MS = 220;
const HOLD_RESPIN_MS = 320;

type PresentPhase =
  | "idle"
  | "reels"
  | "win_gate"
  | "flights"
  | "fs_gap"
  | "splash"
  | "hold_respin"
  | "pick";

const FEATURE_TITLE: Record<TokenColor, string> = {
  green: "Free Spins",
  red: "Hold Night",
  purple: "Locker Pick",
};

const JACKPOT_NOTE: Record<string, string> = {
  mini: "MIN jackpot",
  minor: "MID jackpot",
  major: "MAX jackpot",
  grand: "ULTRA jackpot",
};

function clampDelta(deltaMS: number): number {
  if (!Number.isFinite(deltaMS) || deltaMS <= 0) return 0;
  return Math.min(deltaMS, 100);
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

export async function mountHotlineSession(
  ctx: ShellContext,
): Promise<GameSession> {
  // a bad config throws here, before any dom or app state is touched
  const config = loadHotlineConfig();
  const meterTarget = config.features.tokenOdds.meterTarget;
  const game = createHotlineGame({ seed: ctx.seed, config });

  const tpl = document.querySelector(
    "#hotline-screen-template",
  ) as HTMLTemplateElement | null;
  const cloned = tpl?.content.firstElementChild?.cloneNode(true);
  if (!(cloned instanceof HTMLElement)) {
    throw new Error("hotline session: #hotline-screen-template missing");
  }
  const screen = cloned;

  ctx.root.append(screen);

  const host = screen.querySelector("#game-canvas-host");
  if (!(host instanceof HTMLElement)) {
    throw new Error("hotline session: #game-canvas-host missing");
  }

  host.replaceChildren(ctx.app.canvas);
  ctx.app.resizeTo = host;

  let view: Awaited<ReturnType<typeof mountHotlineView>> | null = null;

  let busy = false;
  let present: PresentPhase = "idle";
  let baseline: MeterBaseline = { green: 0, red: 0, purple: 0 };
  let landed: CollectorSpawn[] = [];
  let pendingOutcome: CollectorOutcome | null = null;
  let holdRespinElapsed = 0;
  let fsGapElapsed = 0;
  let lastSpinWasFree = false;
  let nightStarted = false;
  let splashContinue: (() => void) | null = null;
  let settleArmed = false;

  const overlay = mountFeatureOverlay(screen, {
    onContinue: () => {
      if (present !== "splash") return;
      const next = splashContinue;
      splashContinue = null;
      overlay.hideSplash();
      next?.();
    },
  });

  function applyDisplayFills(fills: readonly number[]): void {
    view?.scene.setPhoneMeters(fills);
  }

  function syncMetersFromLogic(): void {
    const fills = game.getSnapshot().meterFills;
    applyDisplayFills(TOKEN_COLOR_ORDER.map((c) => fills[c].display));
  }

  function syncComboFromSnapshot(): void {
    const night = game.getSnapshot().night;
    if (!night) {
      hud.setComboPath([]);
      hud.setCombo(formatComboStrip([]));
      return;
    }
    const activeIndex =
      night.activeIndex >= 0
        ? night.activeIndex
        : night.path.findIndex((e) => e.state === "active");
    hud.setComboPath(buildComboStripCells(night.path, activeIndex));
  }

  function syncFeatureLine(): void {
    hud.setFeatureLine(formatFeatureLine(game.getSnapshot().night));
  }

  function enterIdle(): void {
    present = "idle";
    busy = false;
    hud.setBusy(false);
    hud.setComboPath([]);
    hud.setCombo("");
    hud.setFeatureLine("");
    view?.scene.setPhoneGlow(null);
    view?.scene.setHoldMode(false);
    view?.scene.setWinCycleMs(DEFAULT_WIN_CYCLE_MS);
    pendingOutcome = null;
    landed = [];
    holdRespinElapsed = 0;
    fsGapElapsed = 0;
    lastSpinWasFree = false;
    nightStarted = false;
    splashContinue = null;
    overlay.hideLockers();
    overlay.hideSplash();
  }

  function showSplash(
    splash: { title: string; total?: string; note?: string },
    onContinue: () => void,
  ): void {
    present = "splash";
    splashContinue = onContinue;
    overlay.showSplash(splash);
  }

  function startReels(unlockAudio: boolean): void {
    if (!view) return;
    baseline = baselineFromMeterFills(game.getSnapshot().meterFills);
    if (unlockAudio) ctx.audio.unlock();
    ctx.audio.play("spin");
    busy = true;
    hud.setBusy(true);
    present = "reels";
    settleArmed = true;
    pendingOutcome = null;
    landed = [];
    view.scene.startSpin(game.getSnapshot().grid);
  }

  function runAfterFeatureStart(color: TokenColor): void {
    if (color === "green") {
      view?.scene.setWinCycleMs(FS_WIN_CYCLE_MS);
      advanceNight();
      return;
    }
    if (color === "purple") {
      present = "pick";
      busy = true;
      hud.setBusy(true);
      overlay.showLockerGrid({
        onPick(index) {
          const revealed = game.pickLocker(index);
          if (revealed === null) return;
          overlay.revealLocker(index, `x${revealed}`);
          ctx.audio.play("pick_reveal");
          advanceNight();
        },
      });
      return;
    }
    if (color === "red") {
      busy = true;
      hud.setBusy(true);
      present = "hold_respin";
      holdRespinElapsed = 0;
      const snap = game.holdSnapshot();
      view?.scene.setHoldMode(true);
      if (snap) view?.scene.syncHold(snap);
      return;
    }
  }

  function afterFreeSpinOrNight(): void {
    if (lastSpinWasFree) {
      lastSpinWasFree = false;
      present = "fs_gap";
      fsGapElapsed = 0;
      return;
    }
    beginNightOrIdle();
  }

  function advanceNight(): void {
    if (!game.isNightActive()) {
      syncMetersFromLogic();
      enterIdle();
      return;
    }

    const step: NightStep = game.nextNightStep();
    syncComboFromSnapshot();
    syncFeatureLine();

    if (step.kind === "wait") return;

    if (step.kind === "feature_start") {
      ctx.audio.play("feature_start");
      game.resetPhoneMeter(step.color);
      syncMetersFromLogic();
      view?.scene.setPhoneGlow(step.color);
      showSplash(
        {
          title: FEATURE_TITLE[step.color],
          note: step.nested ? "Nested feature" : "Tap to continue",
        },
        () => runAfterFeatureStart(step.color),
      );
      return;
    }

    if (step.kind === "fs_spin") {
      const result = game.spinFree();
      if (!result.ok) return;
      lastSpinWasFree = true;
      startReels(false);
      return;
    }

    if (step.kind === "feature_exit") {
      overlay.hideLockers();
      view?.scene.setHoldMode(false);
      let note = step.nested ? "Back to free spins" : "Tap to continue";
      if (step.color === "red") {
        const hold = game.holdSnapshot();
        const jackpot = hold?.jackpotWon;
        if (jackpot && JACKPOT_NOTE[jackpot]) {
          note = JACKPOT_NOTE[jackpot];
          ctx.audio.play("jackpot");
        }
      }
      showSplash(
        {
          title: `${FEATURE_TITLE[step.color]} Total`,
          total: formatCents(step.totalCents),
          note,
        },
        () => {
          ctx.audio.play("feature_end");
          if (step.color === "green") {
            view?.scene.setWinCycleMs(DEFAULT_WIN_CYCLE_MS);
          }
          advanceNight();
        },
      );
      return;
    }

    if (step.kind === "night_total") {
      showSplash(
        {
          title: "COMBO NIGHT",
          total: formatCents(step.totalCents),
          note: "Night total",
        },
        () => advanceNight(),
      );
      return;
    }

    if (step.kind === "done") {
      syncMetersFromLogic();
      enterIdle();
    }
  }

  function beginNightOrIdle(): void {
    if (!game.isNightActive()) {
      syncMetersFromLogic();
      enterIdle();
      return;
    }
    if (!nightStarted) {
      nightStarted = true;
      ctx.audio.play("phone_trigger");
    }
    advanceNight();
  }

  function beginFlights(): void {
    const spawns = pendingOutcome?.spawns ?? [];
    landed = [];
    applyDisplayFills(progressiveDisplayFills(baseline, [], meterTarget));
    if (spawns.length === 0) {
      afterFreeSpinOrNight();
      return;
    }
    present = "flights";
    ctx.audio.play("token_spawn");
    view!.scene.startCollectors(spawns);
  }

  function onCollectorLand(spawn: CollectorSpawn): void {
    landed = [...landed, spawn];
    ctx.audio.play("token_land");
    applyDisplayFills(progressiveDisplayFills(baseline, landed, meterTarget));
  }

  // the math settles in one call, the reels play it back afterwards
  const hudGame: HotlineGame = {
    ...game,
    spin(): SpinResult {
      // ignore mid presentation, empty reason clears the status line
      if (busy || view?.scene.isSpinning()) return { ok: false, reason: "" };
      const result = game.spin();
      if (result.ok && view) {
        view.scene.setPhoneGlow(null);
        hud.setComboPath([]);
        hud.setCombo(formatComboStrip([]));
        startReels(true);
      }
      return result;
    },
    getSnapshot: () => visibleSnapshot(game.getSnapshot()),
  };

  // last win and the win part of the balance stay hidden until the last reel lands
  function visibleSnapshot(snap: HotlineSnapshot): HotlineSnapshot {
    if (!view?.scene.isSpinning()) return snap;
    const balanceCents = Math.round(Number.parseFloat(snap.balanceDisplay) * 100);
    const winCents = Math.round(Number.parseFloat(snap.lastWinDisplay) * 100);
    const held =
      Number.isFinite(balanceCents) && Number.isFinite(winCents)
        ? ((balanceCents - winCents) / 100).toFixed(2)
        : snap.balanceDisplay;
    return { ...snap, phase: "idle", balanceDisplay: held };
  }

  const hud = mountHotlineHud(screen, hudGame, {
    audio: ctx.audio,
    betStepCount: config.math.betStepsCents.length,
    lastWinTweenMs: LAST_WIN_TWEEN_MS,
  });

  function onReelsSettled(snap: HotlineSnapshot): void {
    settleArmed = false;
    const paid = snap.lineWins.reduce((sum, w) => sum + w.payoutCents, 0);
    if (paid > 0) ctx.audio.play("win");
    pendingOutcome = snap.collectorOutcome;
    if (game.isNightActive()) {
      syncFeatureLine();
    }
    if (snap.lineWins.length === 0) {
      beginFlights();
      return;
    }
    present = "win_gate";
  }

  function tickPresent(deltaMS: number): void {
    if (!view) return;
    const dt = clampDelta(deltaMS);

    if (present === "reels" && settleArmed && !view.scene.isSpinning()) {
      onReelsSettled(game.getSnapshot());
    }

    if (present === "win_gate" && view.scene.winsDone()) {
      beginFlights();
    }

    if (present === "flights") {
      view.scene.tickCollectors(deltaMS);
      if (view.scene.collectorsDone()) {
        afterFreeSpinOrNight();
      }
    }

    if (present === "fs_gap") {
      if (dt <= 0) return;
      fsGapElapsed += dt;
      if (fsGapElapsed < FS_GAP_MS) return;
      fsGapElapsed = 0;
      advanceNight();
    }

    if (present === "hold_respin") {
      if (dt <= 0) return;
      view.scene.tickHold(dt);
      holdRespinElapsed += dt;
      if (holdRespinElapsed < HOLD_RESPIN_MS) return;
      holdRespinElapsed = 0;
      const beforeCells = game.holdSnapshot()?.cells.length ?? 0;
      ctx.audio.play("hold_respin");
      const { done } = game.stepHoldRespin();
      const snap = game.holdSnapshot();
      if (snap) view.scene.syncHold(snap);
      if ((snap?.cells.length ?? 0) > beforeCells) {
        ctx.audio.play("hold_land");
      }
      if (!done) return;
      view.scene.setHoldMode(false);
      advanceNight();
    }
  }

  const menuEl = screen.querySelector("[data-action=menu]");
  if (!(menuEl instanceof HTMLButtonElement)) {
    throw new Error("hotline session: data-action=menu missing");
  }
  const menuBtn: HTMLButtonElement = menuEl;
  const onMenuClick = (): void => {
    ctx.requestMenu();
  };
  menuBtn.addEventListener("click", onMenuClick);

  let disposed = false;
  let onTick: ((ticker: Ticker) => void) | null = null;

  const onAbort = (): void => {
    dispose();
  };
  ctx.signal.addEventListener("abort", onAbort, { once: true });

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    ctx.signal.removeEventListener("abort", onAbort);
    menuBtn.removeEventListener("click", onMenuClick);
    if (onTick) {
      ctx.app.ticker.remove(onTick);
      onTick = null;
    }
    view?.scene.setHoldMode(false);
    overlay.dispose();
    hud.dispose();
    if (view) {
      view.scene.destroy();
      view.dispose();
      view = null;
    }
    (ctx.app as { resizeTo: Window | HTMLElement | null }).resizeTo = null;
    ctx.app.stop();
    ctx.app.canvas.remove();
    screen.remove();
  }

  view = await mountHotlineView(ctx.app, config, {
    onReelStop: () => ctx.audio.play("reel_stop"),
    onCollectorLand,
  });
  if (disposed) {
    view.scene.destroy();
    view.dispose();
    view = null;
    return { dispose };
  }

  syncMetersFromLogic();
  hud.render(hudGame.getSnapshot());

  onTick = (ticker: Ticker): void => {
    // scene first so the hud reads the motion state after this frame
    view!.scene.sync(game.getSnapshot(), ticker.deltaMS);
    tickPresent(ticker.deltaMS);
    hud.render(hudGame.getSnapshot());
  };
  ctx.app.ticker.add(onTick);
  ctx.app.start();

  return { dispose };
}
