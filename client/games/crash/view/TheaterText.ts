import { BitmapText, Container, Graphics } from "pixi.js";
import { VIEW_CONFIG } from "./viewConfig.js";

export interface TheaterTextSyncArgs {
  liveText: string;
  liveTint: number;
  liveAlpha: number;
  /** Crashed / NEXT GAME IN */
  titleText?: string | null;
  titlePlacement?: "above" | "below";
  frozenText: string | null;
  /**
   * climb only: current multiplier for growth / pulse / sway / sparks
   * omit / null outside climb so countdown/crash stay static
   */
  pulseMult?: number | null;
  /** for pulse ease / sway / sparks  */
  deltaMS?: number;
  celebrate?: boolean;
  celebrateKick?: boolean;
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
 * live x  tint: near-white through 10x, then smooth white->gold->fire
 * crash / countdown colors are applied by CrashScene
 */
export function theaterTintForMult(m: number): number {
  if (!Number.isFinite(m)) return VIEW_CONFIG.TINT_NEAR_WHITE;
  if (m <= VIEW_CONFIG.TINT_GOLD_START_M) return VIEW_CONFIG.TINT_NEAR_WHITE;

  const start = VIEW_CONFIG.TINT_GOLD_START_M;
  const fireAt = VIEW_CONFIG.TINT_FIRE_AT_M;
  const span = Math.max(1e-6, fireAt - start);
  const t = clamp01((m - start) / span);
  // first half -> gold, second half -> fire
  if (t <= 0.5) {
    return lerpRgb(
      VIEW_CONFIG.TINT_NEAR_WHITE,
      VIEW_CONFIG.TINT_GOLD,
      t * 2,
    );
  }
  return lerpRgb(VIEW_CONFIG.TINT_GOLD, VIEW_CONFIG.TINT_FIRE, (t - 0.5) * 2);
}

/** log-weighted growth 0..1 from LIVE_SCALE_START_M -> LIVE_SCALE_AT_M */
export function liveScaleProgress(m: number): number {
  if (!Number.isFinite(m)) return 0;
  const start = Math.max(1, VIEW_CONFIG.LIVE_SCALE_START_M);
  if (m <= start) return 0;
  const at = Math.max(start + 0.01, VIEW_CONFIG.LIVE_SCALE_AT_M);
  return clamp01(Math.log2(m / start) / Math.log2(at / start));
}

interface Spark {
  g: Graphics;
  vx: number;
  vy: number;
  lifeMs: number;
  maxLifeMs: number;
  active: boolean;
}

/**
 * live theater x + optional title + frozen cash-out x
 * climb: growing scale, +-30(0) sway spark rain
 */
export function createTheaterText(): TheaterText {
  const container = new Container();

  // pivot group rotation/scale stay centered on the live glyph
  const livePivot = new Container();
  const live = new BitmapText({
    text: "",
    style: {
      fontFamily: ["Segoe UI", "system-ui", "sans-serif"],
      fontSize: 64,
      fontWeight: "800",
      fill: 0xffffff,
      align: "center",
      lineHeight: 68,
    },
  });
  live.anchor.set(0.5);
  livePivot.addChild(live);

  const sparkLayer = new Container();
  livePivot.addChild(sparkLayer);

  const poolSize = VIEW_CONFIG.LIVE_SPARK_POOL;
  const sparks: Spark[] = [];
  for (let i = 0; i < poolSize; i++) {
    const g = new Graphics();
    const r = 2.8 + (i % 3) * 0.9;
    const warm = i % 3 === 0 ? 0xffffff : i % 3 === 1 ? 0xfff2a8 : 0xffd24a;
    g.circle(0, 0, r).fill({ color: warm, alpha: 1 });
    g.visible = false;
    sparkLayer.addChild(g);
    sparks.push({
      g,
      vx: 0,
      vy: 0,
      lifeMs: 0,
      maxLifeMs: 1,
      active: false,
    });
  }

  const title = new BitmapText({
    text: "",
    style: {
      fontFamily: ["Segoe UI", "system-ui", "sans-serif"],
      fontSize: 28,
      fontWeight: "800",
      fill: 0xffffff,
    },
  });
  title.anchor.set(0.5);
  title.visible = false;

  const frozen = new BitmapText({
    text: "",
    style: {
      fontFamily: ["Segoe UI", "system-ui", "sans-serif"],
      fontSize: 28,
      fontWeight: "800",
      fill: 0xffffff,
    },
  });
  frozen.anchor.set(0.5);
  frozen.visible = false;

  container.addChild(livePivot, title, frozen);

  let lastWhole = Number.NaN;
  let pulseRemainingMs = 0;
  let swayElapsedMs = 0;
  let spawnAcc = 0;
  let spawnSalt = 0;
  let celebrateRemainingMs = 0;
  let titlePlacement: "above" | "below" = "below";
  let layoutW = 0;
  let layoutH = 0;

  function hideAllSparks(): void {
    for (const s of sparks) {
      s.active = false;
      s.g.visible = false;
    }
    spawnAcc = 0;
  }

  function cappedLiveScale(desired: number): number {
    if (layoutW <= 0) return desired;
    const rawW = live.width;
    if (!(rawW > 0)) return desired;
    const maxW = layoutW * 0.9;
    const maxScale = maxW / rawW;
    return Math.min(desired, maxScale);
  }

  function spawnSpark(): void {
    let slot: Spark | null = null;
    for (const s of sparks) {
      if (!s.active) {
        slot = s;
        break;
      }
    }
    if (!slot) return;

    spawnSalt = (spawnSalt + 1) % 997;
    const jitterX = ((spawnSalt * 37) % 100) / 100 - 0.5;
    const jitterY = ((spawnSalt * 53) % 100) / 100 - 0.5;
    // Spawn near glyph bounds (local space; live is centered at 0,0).
    const halfW = Math.max(24, live.width * 0.45);
    const halfH = Math.max(16, live.height * 0.35);
    slot.g.position.set(jitterX * halfW * 2, jitterY * halfH * 0.6);
    slot.vx = jitterX * 55;
    slot.vy = 40 + ((spawnSalt * 17) % 50);
    slot.maxLifeMs = 420 + (spawnSalt % 280);
    slot.lifeMs = slot.maxLifeMs;
    slot.active = true;
    slot.g.alpha = 1;
    slot.g.scale.set(1);
    slot.g.visible = true;
  }

  function tickSparks(dt: number, intensity: number): void {
    if (intensity < 0.02) {
      hideAllSparks();
      return;
    }

    spawnAcc += (VIEW_CONFIG.LIVE_SPARK_SPAWN_PER_SEC * intensity * dt) / 1000;
    while (spawnAcc >= 1) {
      spawnAcc -= 1;
      spawnSpark();
    }

    const grav = 220; // px/s² downward in local space
    for (const s of sparks) {
      if (!s.active) continue;
      s.lifeMs -= dt;
      if (s.lifeMs <= 0) {
        s.active = false;
        s.g.visible = false;
        continue;
      }
      const sec = dt / 1000;
      s.vy += grav * sec;
      s.g.position.x += s.vx * sec;
      s.g.position.y += s.vy * sec;
      const lifeT = s.lifeMs / s.maxLifeMs;
      // Stay bright longer, then soft fade
      s.g.alpha = Math.min(1, lifeT * 1.35);
      s.g.scale.set(0.85 + lifeT * 0.55);
    }
  }

  function applyTitleOffset(): void {
    if (layoutW <= 0 || layoutH <= 0) return;
    const cx = layoutW * 0.5;
    const liveY = VIEW_CONFIG.THEATER_Y_RATIO * layoutH;
    const offset = VIEW_CONFIG.FROZEN_OFFSET_PX;
    if (titlePlacement === "above") {
      title.position.set(cx, liveY - offset);
    } else {
      title.position.set(cx, liveY + offset);
    }
  }

  function layout(screenWidth: number, screenHeight: number): void {
    layoutW = screenWidth;
    layoutH = screenHeight;
    const cx = screenWidth * 0.5;
    const liveY = VIEW_CONFIG.THEATER_Y_RATIO * screenHeight;
    livePivot.position.set(cx, liveY);
    applyTitleOffset();
    frozen.position.set(cx, liveY + VIEW_CONFIG.FROZEN_OFFSET_PX * 2);
  }

  function sync(args: TheaterTextSyncArgs): void {
    live.text = args.liveText;
    live.tint = args.liveTint;
    live.alpha = args.liveAlpha;
    livePivot.visible = args.liveAlpha > 0 && args.liveText.length > 0;

    titlePlacement = args.titlePlacement === "above" ? "above" : "below";
    applyTitleOffset();

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

    const dt = Number.isFinite(args.deltaMS) ? Math.max(0, args.deltaMS!) : 0;

    if (args.celebrate) {
      lastWhole = Number.NaN;
      pulseRemainingMs = 0;
      swayElapsedMs = 0;
      hideAllSparks();
      livePivot.rotation = 0;
      if (args.celebrateKick || celebrateRemainingMs <= 0) {
        celebrateRemainingMs = VIEW_CONFIG.WIN_CELEBRATE_MS;
      }
      celebrateRemainingMs = Math.max(0, celebrateRemainingMs - dt);
      const dur = Math.max(1, VIEW_CONFIG.WIN_CELEBRATE_MS);
      const u = 1 - celebrateRemainingMs / dur;
      const peak = VIEW_CONFIG.WIN_CELEBRATE_PEAK_SCALE;
      // Ease-out pop then settle to 1.
      const pulseMul =
        celebrateRemainingMs > 0
          ? 1 + (peak - 1) * (1 - u) * (1 - u)
          : 1;
      livePivot.scale.set(cappedLiveScale(pulseMul));
      return;
    }

    celebrateRemainingMs = 0;

    const pulseMult = args.pulseMult;
    const climbing =
      pulseMult != null && Number.isFinite(pulseMult) && pulseMult >= 1;

    if (!climbing) {
      lastWhole = Number.NaN;
      pulseRemainingMs = 0;
      swayElapsedMs = 0;
      livePivot.scale.set(1);
      livePivot.rotation = 0;
      hideAllSparks();
      return;
    }

    const m = pulseMult!;

    // Growth with multiplier (log curve) + brief whole-number pulse on top.
    const growth = liveScaleProgress(m);
    const baseScale =
      1 + (VIEW_CONFIG.LIVE_SCALE_MAX - 1) * growth;

    const whole = Math.floor(m);
    if (Number.isFinite(lastWhole) && whole > lastWhole) {
      pulseRemainingMs = VIEW_CONFIG.PULSE_DURATION_MS;
    }
    lastWhole = whole;

    let pulseMul = 1;
    if (pulseRemainingMs > 0) {
      pulseRemainingMs = Math.max(0, pulseRemainingMs - dt);
      const dur = Math.max(1, VIEW_CONFIG.PULSE_DURATION_MS);
      const u = 1 - pulseRemainingMs / dur;
      const peak = VIEW_CONFIG.PULSE_PEAK_SCALE;
      pulseMul = 1 + (peak - 1) * (1 - u) * (1 - u);
    }
    livePivot.scale.set(cappedLiveScale(baseScale * pulseMul));

    // sway after LIVE_SWAY_START_M: start upright (0(0)), then CW -> CCW at constant speed
    // triangle: 0 -> +amp -> 0 -> −amp -> 0
    if (m > VIEW_CONFIG.LIVE_SWAY_START_M) {
      swayElapsedMs += dt;
      const period = Math.max(1, VIEW_CONFIG.LIVE_SWAY_PERIOD_MS);
      const amp = (VIEW_CONFIG.LIVE_SWAY_DEG * Math.PI) / 180;
      const phase = (swayElapsedMs % period) / period; // 0..1
      let tri: number;
      if (phase < 0.25) tri = phase * 4; // 0 -> +1
      else if (phase < 0.5) tri = 2 - phase * 4; // +1 -> 0
      else if (phase < 0.75) tri = 2 - phase * 4; // 0 -> −1
      else tri = phase * 4 - 4; // −1 -> 0
      livePivot.rotation = amp * Math.max(-1, Math.min(1, tri));
    } else {
      swayElapsedMs = 0;
      livePivot.rotation = 0;
    }

    // spark rain ramps after LIVE_SPARK_START_M
    const sparkStart = VIEW_CONFIG.LIVE_SPARK_START_M;
    const sparkAt = Math.max(sparkStart + 0.01, VIEW_CONFIG.LIVE_SPARK_AT_M);
    const sparkIntensity = clamp01(
      (m - sparkStart) / (sparkAt - sparkStart),
    );
    tickSparks(dt, sparkIntensity);
  }

  return { container, sync, layout };
}
