import { BitmapText, Container } from "pixi.js";
import { VIEW_CONFIG } from "./viewConfig.js";

export interface TheaterTextSyncArgs {
  liveText: string;
  liveTint: number;
  liveAlpha: number;
  /** Hide frozen node when null. */
  frozenText: string | null;
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

/** D-15: log2 ramp from white → CRASH_COLOR as m approaches 8×. */
export function theaterTintForMult(m: number): number {
  if (!Number.isFinite(m) || m <= 1) return 0xffffff;
  const t = clamp01(Math.log2(m) / Math.log2(8));
  const from = { r: 0xff, g: 0xff, b: 0xff };
  const to = {
    r: (VIEW_CONFIG.CRASH_COLOR >> 16) & 0xff,
    g: (VIEW_CONFIG.CRASH_COLOR >> 8) & 0xff,
    b: VIEW_CONFIG.CRASH_COLOR & 0xff,
  };
  const r = lerpChannel(from.r, to.r, t);
  const g = lerpChannel(from.g, to.g, t);
  const b = lerpChannel(from.b, to.b, t);
  return (r << 16) | (g << 8) | b;
}

/**
 * Live theater × + frozen cash-out × (D-13, D-14, D-16).
 * Strings come from formatMult assigned to BitmapText.text — never innerHTML.
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

  container.addChild(live, frozen);

  function layout(screenWidth: number, screenHeight: number): void {
    const cx = screenWidth * 0.5;
    const liveY = VIEW_CONFIG.THEATER_Y_RATIO * screenHeight;
    live.position.set(cx, liveY);
    frozen.position.set(cx, liveY + VIEW_CONFIG.FROZEN_OFFSET_PX);
  }

  function sync(args: TheaterTextSyncArgs): void {
    live.text = args.liveText;
    live.tint = args.liveTint;
    live.alpha = args.liveAlpha;
    live.visible = args.liveAlpha > 0 && args.liveText.length > 0;

    if (args.frozenText == null) {
      frozen.visible = false;
      frozen.text = "";
    } else {
      frozen.visible = true;
      frozen.text = args.frozenText;
      frozen.tint = 0xffffff;
      frozen.alpha = 1;
    }
  }

  return { container, sync, layout };
}
