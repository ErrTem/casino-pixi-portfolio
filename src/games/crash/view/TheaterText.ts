import { BitmapText, Container } from "pixi.js";
import { VIEW_CONFIG } from "./viewConfig.js";

export interface TheaterTextSyncArgs {
  liveText: string;
  liveTint: number;
  liveAlpha: number;
  /** Optional title under live (e.g. "Crashed"). Hide when null/empty. */
  titleText?: string | null;
  /** Hide frozen node when null. */
  frozenText: string | null;
  /**
   * Climb-only: current multiplier for whole-number pulse detection.
   * Omit / null outside climb so countdown/crash never pulse.
   */
  pulseMult?: number | null;
  /** Frame delta for pulse ease (ms). */
  deltaMS?: number;
}

export interface TheaterText {
  container: Container;
  sync: (args: TheaterTextSyncArgs) => void;
  layout: (screenWidth: number, screenHeight: number) => void;
}

function clamp01(t: number): number {
  if (!Number.isFinite(t)) return 0;
  return Math.min(1, Math.max(0, t));
}

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function lerpRgb(from: number, to: number, t: number): number {
  const u = clamp01(t);
  const r = lerpChannel((from >> 16) & 0xff, (to >> 16) & 0xff, u);
  const g = lerpChannel((from >> 8) & 0xff, (to >> 8) & 0xff, u);
  const b = lerpChannel(from & 0xff, to & 0xff, u);
  return (r << 16) | (g << 8) | b;
}

/**
 * Live × tint: near-white through 10×, then smooth white→gold→fire.
 * Crash / countdown colors are applied by CrashScene — not here.
 */
export function theaterTintForMult(m: number): number {
  if (!Number.isFinite(m)) return VIEW_CONFIG.TINT_NEAR_WHITE;
  if (m <= VIEW_CONFIG.TINT_GOLD_START_M) return VIEW_CONFIG.TINT_NEAR_WHITE;

  const start = VIEW_CONFIG.TINT_GOLD_START_M;
  const fireAt = VIEW_CONFIG.TINT_FIRE_AT_M;
  const span = Math.max(1e-6, fireAt - start);
  const t = clamp01((m - start) / span);
  // First half → gold, second half → fire.
  if (t <= 0.5) {
    return lerpRgb(
      VIEW_CONFIG.TINT_NEAR_WHITE,
      VIEW_CONFIG.TINT_GOLD,
      t * 2,
    );
  }
  return lerpRgb(VIEW_CONFIG.TINT_GOLD, VIEW_CONFIG.TINT_FIRE, (t - 0.5) * 2);
}

/**
 * Live theater × + optional title + frozen cash-out ×.
 * Strings assigned to BitmapText.text — never innerHTML.
 */
export function createTheaterText(): TheaterText {
  const container = new Container();

  const live = new BitmapText({
    text: "",
    style: {
      fontFamily: "Arial",
      fontSize: 64,
      fill: 0xffffff,
    },
  });
  live.anchor.set(0.5);

  const title = new BitmapText({
    text: "",
    style: {
      fontFamily: "Arial",
      fontSize: 28,
      fill: 0xffffff,
    },
  });
  title.anchor.set(0.5);
  title.visible = false;

  const frozen = new BitmapText({
    text: "",
    style: {
      fontFamily: "Arial",
      fontSize: 28,
      fill: 0xffffff,
    },
  });
  frozen.anchor.set(0.5);
  frozen.visible = false;

  container.addChild(live, title, frozen);

  let lastWhole = Number.NaN;
  let pulseRemainingMs = 0;

  function layout(screenWidth: number, screenHeight: number): void {
    const cx = screenWidth * 0.5;
    const liveY = VIEW_CONFIG.THEATER_Y_RATIO * screenHeight;
    live.position.set(cx, liveY);
    title.position.set(cx, liveY + VIEW_CONFIG.FROZEN_OFFSET_PX);
    frozen.position.set(cx, liveY + VIEW_CONFIG.FROZEN_OFFSET_PX * 2);
  }

  function sync(args: TheaterTextSyncArgs): void {
    live.text = args.liveText;
    live.tint = args.liveTint;
    live.alpha = args.liveAlpha;
    live.visible = args.liveAlpha > 0 && args.liveText.length > 0;

    const titleText = args.titleText ?? null;
    if (titleText == null || titleText.length === 0) {
      title.visible = false;
      title.text = "";
    } else {
      title.visible = true;
      title.text = titleText;
      title.tint = args.liveTint;
      title.alpha = args.liveAlpha;
    }

    if (args.frozenText == null) {
      frozen.visible = false;
      frozen.text = "";
    } else {
      frozen.visible = true;
      frozen.text = args.frozenText;
      frozen.tint = 0xffffff;
      frozen.alpha = 1;
    }

    // Whole-number scale pulse — climb only.
    const pulseMult = args.pulseMult;
    if (
      pulseMult != null &&
      Number.isFinite(pulseMult) &&
      pulseMult >= 1
    ) {
      const whole = Math.floor(pulseMult);
      if (Number.isFinite(lastWhole) && whole > lastWhole) {
        pulseRemainingMs = VIEW_CONFIG.PULSE_DURATION_MS;
      }
      lastWhole = whole;

      const dt = Number.isFinite(args.deltaMS)
        ? Math.max(0, args.deltaMS!)
        : 0;
      if (pulseRemainingMs > 0) {
        pulseRemainingMs = Math.max(0, pulseRemainingMs - dt);
        const dur = Math.max(1, VIEW_CONFIG.PULSE_DURATION_MS);
        const u = 1 - pulseRemainingMs / dur;
        // Ease out: peak at start, settle to 1.
        const peak = VIEW_CONFIG.PULSE_PEAK_SCALE;
        const s = 1 + (peak - 1) * (1 - u) * (1 - u);
        live.scale.set(s);
      } else {
        live.scale.set(1);
      }
    } else {
      lastWhole = Number.NaN;
      pulseRemainingMs = 0;
      live.scale.set(1);
    }
  }

  return { container, sync, layout };
}
