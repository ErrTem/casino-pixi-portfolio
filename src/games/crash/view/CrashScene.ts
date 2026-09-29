import { Application, Container, Graphics } from "pixi.js";
import { formatMult } from "../hud/format.js";
import type { CrashSnapshot } from "../logic/index.js";
import { createBackdrop } from "./Backdrop.js";
import { createCurveGraph } from "./CurveGraph.js";
import { formatWaitCountdown } from "./formatWaitCountdown.js";
import {
  gentleTiltRadians,
  pathTangentRadians,
  plotPoint,
  plotScaleFor,
  type PlotRect,
} from "./pathMapping.js";
import { createRocket } from "./Rocket.js";
import { createTheaterText, theaterTintForMult } from "./TheaterText.js";
import { VIEW_CONFIG } from "./viewConfig.js";
import {
  createInitialViewMode,
  reduceViewMode,
  type ViewModeState,
} from "./viewMode.js";

export interface CrashScene {
  sync: (snapshot: CrashSnapshot, deltaMS: number) => void;
}

function buildPlot(screenW: number, screenH: number): PlotRect {
  const top = VIEW_CONFIG.PLOT_TOP_RATIO * screenH;
  return {
    x: 24,
    y: top,
    width: Math.max(1, screenW - 48),
    height: Math.max(1, screenH - top - 24),
  };
}

function samplePoints(
  tipMult: number,
  plot: PlotRect,
): ReturnType<typeof plotPoint>[] {
  const scale = plotScaleFor(tipMult);
  const n = VIEW_CONFIG.SAMPLE_COUNT;
  const mMax = Math.max(1, tipMult);
  const pts: ReturnType<typeof plotPoint>[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const m = 1 + (mMax - 1) * t;
    pts.push(plotPoint(m, plot, scale));
  }
  return pts;
}

function drawFlashRect(g: Graphics, w: number, h: number): void {
  g.clear();
  g.rect(0, 0, w, h).fill({ color: VIEW_CONFIG.CRASH_COLOR });
}

/**
 * Stage graph (D-17 / Pattern 5):
 *   backdrop (screen-fixed) → world (curve+ghost+rocket) → theater (upper third) → flash
 * Camera offset ONLY via world.position — never app.stage.x/y.
 */
export function createCrashScene(app: Application): CrashScene {
  const backdrop = createBackdrop(app.screen.width, app.screen.height);
  const curve = createCurveGraph();
  const ghost = new Graphics();
  ghost.circle(0, 0, 14).stroke({
    width: 2,
    color: 0xffffff,
    alpha: 0.28,
  });
  ghost.visible = false;
  const rocket = createRocket();
  const theater = createTheaterText();
  const flash = new Graphics();
  drawFlashRect(flash, app.screen.width, app.screen.height);
  flash.alpha = 0;

  // World Container camera (D-17): curve + ghost + rocket scroll as a group.
  const world = new Container({ label: "crash-world" });
  world.addChild(curve.container, ghost, rocket.container);

  // Theater stays a stage child outside world — upper-third, clear of craft (D-20).
  // Flash screen-fixed. NEVER write app.stage.x / app.stage.y.
  app.stage.addChild(backdrop.container, world, theater.container, flash);

  let viewMode: ViewModeState = createInitialViewMode();
  let plot = buildPlot(app.screen.width, app.screen.height);
  let lastW = app.screen.width;
  let lastH = app.screen.height;
  let holdDrawn = false;
  let idleElapsedMs = 0;
  /** Latched world offset at crash frame (D-19). */
  let frozenWorld: { x: number; y: number } | null = null;

  theater.layout(lastW, lastH);

  function craftLockPoint(): { x: number; y: number } {
    // Near screen center, slightly below theater upper third (D-17 / D-20).
    return {
      x: lastW * 0.5,
      y: lastH * VIEW_CONFIG.CAMERA_CENTER_Y_RATIO,
    };
  }

  function ensurePlot(): void {
    const w = app.screen.width;
    const h = app.screen.height;
    if (w !== lastW || h !== lastH) {
      lastW = w;
      lastH = h;
      plot = buildPlot(w, h);
      holdDrawn = false;
      theater.layout(w, h);
      backdrop.rebuildIfNeeded(w, h);
      drawFlashRect(flash, w, h);
    }
  }

  function sync(snapshot: CrashSnapshot, deltaMS: number): void {
    ensurePlot();

    viewMode = reduceViewMode(
      viewMode,
      {
        phase: snapshot.phase,
        multiplier: snapshot.multiplier,
        cashOutAt: snapshot.cashOutAt,
        history: snapshot.history,
      },
      deltaMS,
    );

    const {
      mode,
      modeElapsedMs,
      rocketVisible,
      trailAlpha,
      latchedCrashMult,
      latchedCashOut,
    } = viewMode;
    curve.container.alpha = trailAlpha;
    rocket.container.visible = rocketVisible;

    // Flash from crash_hold clock only (D-10). Never write stage.x / stage.y.
    if (mode === "crash_hold" && modeElapsedMs < VIEW_CONFIG.FLASH_MS) {
      const t = modeElapsedMs / VIEW_CONFIG.FLASH_MS;
      flash.alpha = VIEW_CONFIG.FLASH_PEAK_ALPHA * (1 - t);
    } else {
      flash.alpha = 0;
    }

    if (mode === "climb") {
      holdDrawn = false;
      idleElapsedMs = 0;
      frozenWorld = null;
      ghost.visible = false;
      const tip = Math.max(1, snapshot.multiplier);
      const pts = samplePoints(tip, plot);
      curve.redraw(pts, VIEW_CONFIG.CLIMB_COLOR, false);
      const scale = plotScaleFor(tip);
      const pos = plotPoint(tip, plot, scale);
      const lock = craftLockPoint();
      // Tip in world/plot space → lock point in screen space via world offset.
      world.position.set(lock.x - pos.x, lock.y - pos.y);
      const rot = gentleTiltRadians(pathTangentRadians(tip, plot, scale));
      rocket.syncPose(pos.x, pos.y, rot, true);
      rocket.container.visible = true;
    } else if (mode === "crash_hold") {
      idleElapsedMs = 0;
      ghost.visible = false;
      // Freeze camera at crash frame (D-19).
      if (frozenWorld == null) {
        frozenWorld = { x: world.position.x, y: world.position.y };
      }
      world.position.set(frozenWorld.x, frozenWorld.y);
      if (!holdDrawn) {
        const tip = latchedCrashMult ?? Math.max(1, snapshot.multiplier);
        const pts = samplePoints(tip, plot);
        curve.redraw(pts, VIEW_CONFIG.CRASH_COLOR, true);
        holdDrawn = true;
      }
      rocket.container.visible = false;
    } else if (mode === "crash_fade") {
      idleElapsedMs = 0;
      ghost.visible = false;
      if (frozenWorld != null) {
        world.position.set(frozenWorld.x, frozenWorld.y);
      }
      // Keep severed geometry; alpha from reducer.
      rocket.container.visible = false;
    } else {
      // idle: world identity + ghost origin + bobbing parked rocket (D-17, D-19)
      holdDrawn = false;
      frozenWorld = null;
      world.position.set(0, 0);
      curve.container.alpha = 0;
      idleElapsedMs += Number.isFinite(deltaMS) ? Math.max(0, deltaMS) : 0;
      const scale = plotScaleFor(1);
      const origin = plotPoint(1, plot, scale);
      ghost.position.set(origin.x, origin.y);
      ghost.visible = true;
      const bob =
        Math.sin(
          (idleElapsedMs * 2 * Math.PI) / VIEW_CONFIG.BOB_PERIOD_MS,
        ) * VIEW_CONFIG.BOB_AMPLITUDE_PX;
      rocket.syncPose(origin.x, origin.y + bob, 0, false);
      rocket.container.visible = rocketVisible;
    }

    // Theater dual-read (D-13..D-16, D-20 idle dim last crash ×;
    // Phase 5 D-01..D-04: waiting+idle shows continuous tenths countdown)
    let liveText: string;
    let liveTint: number;
    let liveAlpha: number;

    const showCountdown =
      snapshot.phase === "waiting" && mode === "idle";

    if (showCountdown) {
      liveText = formatWaitCountdown(snapshot.waitRemainingMs);
      liveTint = 0xffffff;
      liveAlpha = 1;
    } else if (mode === "crash_hold" || mode === "crash_fade") {
      const liveMult =
        latchedCrashMult != null && Number.isFinite(latchedCrashMult)
          ? latchedCrashMult
          : snapshot.multiplier;
      liveText = formatMult(liveMult);
      liveTint = VIEW_CONFIG.CRASH_COLOR;
      liveAlpha = 1;
    } else if (mode === "idle") {
      // Non-waiting idle safety — dimmed last-crash × (Phase 3 D-20)
      if (latchedCrashMult != null && Number.isFinite(latchedCrashMult)) {
        liveText = formatMult(latchedCrashMult);
        liveTint = VIEW_CONFIG.CRASH_COLOR;
        liveAlpha = VIEW_CONFIG.IDLE_CRASH_ALPHA;
      } else {
        liveText = "";
        liveTint = 0xffffff;
        liveAlpha = 0;
      }
    } else {
      // climb — countdown cleared on flight (D-03)
      liveText = formatMult(snapshot.multiplier);
      liveTint = theaterTintForMult(snapshot.multiplier);
      liveAlpha = 1;
    }

    const frozenText =
      latchedCashOut != null && Number.isFinite(latchedCashOut)
        ? formatMult(latchedCashOut)
        : null;

    theater.sync({
      liveText,
      liveTint,
      liveAlpha,
      frozenText,
    });
  }

  return { sync };
}
