import type { Ticker } from "pixi.js";
import type { GameSession, ShellContext } from "../../../shell/types.js";
import { loadHotlineConfig } from "../config/loadHotlineConfig.js";
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
  type SpinResult,
} from "../logic/index.js";
import { mountHotlineView } from "../view/mountHotlineView.js";
import {
  baselineFromMeterFills,
  formatComboStrip,
  progressiveDisplayFills,
  type MeterBaseline,
} from "./collectPresentation.js";

const LAST_WIN_TWEEN_MS = 900;
const STUB_BEAT_MS = 700;

type PresentPhase = "idle" | "reels" | "win_gate" | "flights" | "stub";

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
  let stubQueue: TokenColor[] = [];
  let stubElapsed = 0;

  function applyDisplayFills(fills: readonly number[]): void {
    view?.scene.setPhoneMeters(fills);
  }

  function syncMetersFromLogic(): void {
    const fills = game.getSnapshot().meterFills;
    applyDisplayFills(TOKEN_COLOR_ORDER.map((c) => fills[c].display));
  }

  function enterIdle(): void {
    present = "idle";
    busy = false;
    hud.setBusy(false);
    hud.setCombo("");
    view?.scene.setPhoneGlow(null);
    pendingOutcome = null;
    landed = [];
    stubQueue = [];
    stubElapsed = 0;
  }

  function showStubHead(): void {
    if (stubQueue.length === 0) {
      syncMetersFromLogic();
      enterIdle();
      return;
    }
    view?.scene.setPhoneGlow(stubQueue[0]);
    hud.setCombo(formatComboStrip(stubQueue));
  }

  function beginStubOrIdle(): void {
    const queue = pendingOutcome?.queue ?? [];
    if (queue.length === 0) {
      syncMetersFromLogic();
      enterIdle();
      return;
    }
    present = "stub";
    stubQueue = queue.slice();
    stubElapsed = 0;
    ctx.audio.play("phone_trigger");
    showStubHead();
  }

  function beginFlights(): void {
    const spawns = pendingOutcome?.spawns ?? [];
    landed = [];
    applyDisplayFills(progressiveDisplayFills(baseline, [], meterTarget));
    if (spawns.length === 0) {
      beginStubOrIdle();
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
    spin(): SpinResult {
      // ignore mid presentation, empty reason clears the status line
      if (busy || view?.scene.isSpinning()) return { ok: false, reason: "" };
      baseline = baselineFromMeterFills(game.getSnapshot().meterFills);
      const result = game.spin();
      if (result.ok && view) {
        ctx.audio.unlock();
        ctx.audio.play("spin");
        busy = true;
        hud.setBusy(true);
        present = "reels";
        settleArmed = true;
        pendingOutcome = null;
        landed = [];
        stubQueue = [];
        stubElapsed = 0;
        view.scene.setPhoneGlow(null);
        hud.setCombo("");
        view.scene.startSpin(game.getSnapshot().grid);
      }
      return result;
    },
    setBetStepIndex: (index) => game.setBetStepIndex(index),
    resetPhoneMeter: (color) => game.resetPhoneMeter(color),
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

  // armed by a spin, fires once when the reels come to rest
  let settleArmed = false;
  function onReelsSettled(snap: HotlineSnapshot): void {
    settleArmed = false;
    const paid = snap.lineWins.reduce((sum, w) => sum + w.payoutCents, 0);
    if (paid > 0) ctx.audio.play("win");
    pendingOutcome = snap.collectorOutcome;
    if (snap.lineWins.length === 0) {
      beginFlights();
      return;
    }
    present = "win_gate";
  }

  function tickPresent(deltaMS: number): void {
    if (!view) return;

    if (present === "reels" && settleArmed && !view.scene.isSpinning()) {
      onReelsSettled(game.getSnapshot());
    }

    if (present === "win_gate" && view.scene.winsDone()) {
      beginFlights();
    }

    if (present === "flights") {
      view.scene.tickCollectors(deltaMS);
      if (view.scene.collectorsDone()) {
        beginStubOrIdle();
      }
    }

    if (present === "stub") {
      if (!Number.isFinite(deltaMS) || deltaMS <= 0) return;
      stubElapsed += deltaMS;
      if (stubElapsed < STUB_BEAT_MS) return;
      stubElapsed = 0;
      const color = stubQueue.shift();
      if (color) {
        ctx.audio.play("queue_step");
        game.resetPhoneMeter(color);
        syncMetersFromLogic();
      }
      showStubHead();
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
