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
 *   backdrop (screen-fixed) → world (curve+rocket) → theater (upper third) → flash
 * Camera offset ONLY via world.position — never app.stage.x/y.
 */
export function createCrashScene(app: Application): CrashScene {
  const backdrop = createBackdrop(app.screen.width, app.screen.height);
  const curve = createCurveGraph();
  const rocket = createRocket();
  const theater = createTheaterText();
  const flash = new Graphics();
  drawFlashRect(flash, app.screen.width, app.screen.height);
  flash.alpha = 0;

  // World Container camera (D-17): curve + rocket scroll as a group.
  const world = new Container({ label: "crash-world" });
  world.addChild(curve.container, rocket.container);

  // Theater stays a stage child outside world — upper-third, clear of craft (D-20).
  // Flash screen-fixed. NEVER write app.stage.x / app.stage.y.
  app.stage.addChild(backdrop.container, world, theater.container, flash);

  let viewMode: ViewModeState = createInitialViewMode();
  let plot = buildPlot(app.screen.width, app.screen.height);
  let lastW = app.screen.width;
  let lastH = app.screen.height;
  let holdDrawn = false;
  let idleElapsedMs = 0;
  /** Latched world transform at crash frame (D-19). */
  let frozenWorld: {
    x: number;
    y: number;
    rotation: number;
    pivotX: number;
    pivotY: number;
  } | null = null;

  theater.layout(lastW, lastH);

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
    backdrop.tick(deltaMS);

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
      const tip = Math.max(1, snapshot.multiplier);
      const pts = samplePoints(tip, plot);
      const scale = plotScaleFor(tip);
      const pos = plotPoint(tip, plot, scale);
      // Tip-follow camera on world Container only (never stage.x/y).
      // Pivot identity + rotation 0; lerp so tip locks near screen center.
      world.pivot.set(0, 0);
      world.rotation = 0;
      const lockX = lastW * VIEW_CONFIG.CAMERA_CENTER_X_RATIO;
      const lockY = lastH * VIEW_CONFIG.CAMERA_CENTER_Y_RATIO;
      const targetX = lockX - pos.x;
      const targetY = lockY - pos.y;
      const dt = Number.isFinite(deltaMS) ? Math.max(0, deltaMS) : 0;
      const tau = Math.max(1, VIEW_CONFIG.CAMERA_LERP_TAU_MS);
      const a = 1 - Math.exp(-dt / tau);
      world.position.set(
        world.position.x + (targetX - world.position.x) * a,
        world.position.y + (targetY - world.position.y) * a,
      );
      curve.redraw(pts, VIEW_CONFIG.CLIMB_COLOR, false);
      const rot = gentleTiltRadians(pathTangentRadians(tip, plot, scale));
      rocket.syncPose(pos.x, pos.y, rot, true);
      rocket.container.visible = true;
    } else if (mode === "crash_hold") {
      idleElapsedMs = 0;
      // Freeze camera at crash frame (D-19).
      if (frozenWorld == null) {
        frozenWorld = {
          x: world.position.x,
          y: world.position.y,
          rotation: world.rotation,
          pivotX: world.pivot.x,
          pivotY: world.pivot.y,
        };
      }
      world.pivot.set(frozenWorld.pivotX, frozenWorld.pivotY);
      world.position.set(frozenWorld.x, frozenWorld.y);
      world.rotation = frozenWorld.rotation;
      if (!holdDrawn) {
        const tip = latchedCrashMult ?? Math.max(1, snapshot.multiplier);
        const pts = samplePoints(tip, plot);
        curve.redraw(pts, VIEW_CONFIG.CRASH_COLOR, true);
        holdDrawn = true;
      }
      rocket.container.visible = false;
    } else if (mode === "crash_fade") {
      idleElapsedMs = 0;
      if (frozenWorld != null) {
        world.pivot.set(frozenWorld.pivotX, frozenWorld.pivotY);
        world.position.set(frozenWorld.x, frozenWorld.y);
        world.rotation = frozenWorld.rotation;
      }
      // Keep severed geometry; alpha from reducer.
      rocket.container.visible = false;
    } else {
      // idle: parked rocket fixed at path origin (no bob)
      holdDrawn = false;
      frozenWorld = null;
      world.pivot.set(0, 0);
      world.position.set(0, 0);
      world.rotation = 0;
      curve.container.alpha = 0;
      idleElapsedMs = 0;
      const scale = plotScaleFor(1);
      const origin = plotPoint(1, plot, scale);
      rocket.syncPose(origin.x, origin.y, 0, false);
      rocket.container.visible = rocketVisible;
    }

    // Theater: countdown while waiting+idle; Crashed × during hold/fade; live × on climb
    let liveText: string;
    let liveTint: number;
    let liveAlpha: number;
    let titleText: string | null = null;

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
      titleText = "Crashed";
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
      // climb — countdown cleared on flight
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
      titleText,
      frozenText,
    });
  }

  return { sync };
}
