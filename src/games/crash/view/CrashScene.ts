import { Application } from "pixi.js";
import { formatMult } from "../hud/format.js";
import type { CrashSnapshot } from "../logic/index.js";
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

export function createCrashScene(app: Application): CrashScene {
  const curve = createCurveGraph();
  const rocket = createRocket();
  const theater = createTheaterText();
  app.stage.addChild(curve.container, rocket.container, theater.container);

  let viewMode: ViewModeState = createInitialViewMode();
  let plot = buildPlot(app.screen.width, app.screen.height);
  let lastW = app.screen.width;
  let lastH = app.screen.height;
  let holdDrawn = false;

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

    const { mode, rocketVisible, trailAlpha, latchedCrashMult, latchedCashOut } =
      viewMode;
    curve.container.alpha = trailAlpha;
    rocket.container.visible = rocketVisible;

    if (mode === "climb") {
      holdDrawn = false;
      const tip = Math.max(1, snapshot.multiplier);
      const pts = samplePoints(tip, plot);
      curve.redraw(pts, VIEW_CONFIG.CLIMB_COLOR, false);
      const scale = plotScaleFor(tip);
      const pos = plotPoint(tip, plot, scale);
      const rot = pathTangentRadians(tip, plot, scale);
      rocket.syncPose(pos.x, pos.y, rot, true);
      rocket.container.visible = true;
    } else if (mode === "crash_hold") {
      if (!holdDrawn) {
        const tip = latchedCrashMult ?? Math.max(1, snapshot.multiplier);
        const pts = samplePoints(tip, plot);
        curve.redraw(pts, VIEW_CONFIG.CRASH_COLOR, true);
        holdDrawn = true;
      }
      rocket.container.visible = false;
    } else if (mode === "crash_fade") {
      // Keep severed geometry; alpha from reducer.
      rocket.container.visible = false;
    } else {
      // idle
      holdDrawn = false;
      curve.container.alpha = 0;
      const scale = plotScaleFor(1);
      const origin = plotPoint(1, plot, scale);
      rocket.syncPose(origin.x, origin.y, 0, false);
      rocket.container.visible = rocketVisible;
    }

    // Theater dual-read (D-13..D-16)
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
