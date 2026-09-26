import { Application, Graphics } from "pixi.js";
import { formatMult } from "../hud/format.js";
import type { CrashSnapshot } from "../logic/index.js";
import { createBackdrop } from "./Backdrop.js";
import { createCurveGraph } from "./CurveGraph.js";
import {
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

  // Backdrop behind trail; flash above spectacle (D-04, D-10). No stage.x/y.
  app.stage.addChild(
    backdrop.container,
    curve.container,
    ghost,
    rocket.container,
    theater.container,
    flash,
  );

  let viewMode: ViewModeState = createInitialViewMode();
  let plot = buildPlot(app.screen.width, app.screen.height);
  let lastW = app.screen.width;
  let lastH = app.screen.height;
  let holdDrawn = false;
  let idleElapsedMs = 0;

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
    if (
      mode === "crash_hold" &&
      modeElapsedMs < VIEW_CONFIG.FLASH_MS
    ) {
      const t = modeElapsedMs / VIEW_CONFIG.FLASH_MS;
      flash.alpha = VIEW_CONFIG.FLASH_PEAK_ALPHA * (1 - t);
    } else {
      flash.alpha = 0;
    }

    if (mode === "climb") {
      holdDrawn = false;
      idleElapsedMs = 0;
      ghost.visible = false;
      const tip = Math.max(1, snapshot.multiplier);
      const pts = samplePoints(tip, plot);
      curve.redraw(pts, VIEW_CONFIG.CLIMB_COLOR, false);
      const scale = plotScaleFor(tip);
      const pos = plotPoint(tip, plot, scale);
      const rot = pathTangentRadians(tip, plot, scale);
      rocket.syncPose(pos.x, pos.y, rot, true);
      rocket.container.visible = true;
    } else if (mode === "crash_hold") {
      idleElapsedMs = 0;
      ghost.visible = false;
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
      // Keep severed geometry; alpha from reducer.
      rocket.container.visible = false;
    } else {
      // idle: ghost origin + bobbing parked rocket (D-17, D-19)
      holdDrawn = false;
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

    // Theater dual-read (D-13..D-16, D-20 idle dim last crash ×)
    let liveText: string;
    let liveTint: number;
    let liveAlpha: number;

    if (mode === "crash_hold" || mode === "crash_fade") {
      const liveMult =
        latchedCrashMult != null && Number.isFinite(latchedCrashMult)
          ? latchedCrashMult
          : snapshot.multiplier;
      liveText = formatMult(liveMult);
      liveTint = VIEW_CONFIG.CRASH_COLOR;
      liveAlpha = 1;
    } else if (mode === "idle") {
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
      // climb
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
