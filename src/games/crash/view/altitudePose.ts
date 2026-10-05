import { VIEW_CONFIG } from "./viewConfig.js";

/** per layer screen offsets / alphas driven by climb multiplier (height) */
export type AltitudePose = {
  /** earth: positive Y slides the ground strip off the bottom */
  earthY: number;
  earthAlpha: number;
  /** clouds: positive Y drifts the band downward (flying up through them) */
  cloudY: number;
  cloudAlpha: number;
  /** space: negative Y hangs the starfield at the top until reveal */
  spaceY: number;
  spaceAlpha: number;
};

function clamp01(t: number): number {
  if (!Number.isFinite(t)) return 0;
  return Math.min(1, Math.max(0, t));
}

/** hermite smoothstep between edge0 -> edge1. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const span = edge1 - edge0;
  if (!(span > 0) || !Number.isFinite(x)) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / span);
  return t * t * (3 - 2 * t);
}

/**
 * map climb multiplier -> backdrop layer height pose
 *
 * bands (VIEW_CONFIG):
 * - 1 -> EARTH_END_M: earth slides down and fades; clouds + faint space remain
 * - EARTH_END_M -> CLOUD_END_M: clouds drift top->bottom
 * - CLOUD_END_M+: space settles and brightens (started barely visible at top)
 */
export function computeAltitudePose(
  multiplier: number,
  screenH: number,
): AltitudePose {
  const m = Number.isFinite(multiplier) ? Math.max(1, multiplier) : 1;
  const h = Math.max(1, screenH);

  const earthEnd = VIEW_CONFIG.ALTITUDE_EARTH_END_M;
  const cloudEnd = VIEW_CONFIG.ALTITUDE_CLOUD_END_M;
  const spaceFull = VIEW_CONFIG.ALTITUDE_SPACE_FULL_M;

  // 1. earth exit (1 -> 10)
  const earthT = smoothstep(1, earthEnd, m);
  const earthY = earthT * h * VIEW_CONFIG.ALTITUDE_EARTH_SLIDE_RATIO;
  const earthAlpha = 1 - earthT;

  // 2. cloud descent (10 -> 30) soft fade after cloud band
  const cloudScrollT = smoothstep(earthEnd, cloudEnd, m);
  const cloudFadeT = smoothstep(cloudEnd, spaceFull, m);
  const cloudY = cloudScrollT * h * VIEW_CONFIG.ALTITUDE_CLOUD_SCROLL_RATIO;
  const cloudAlpha = 1 - cloudFadeT * VIEW_CONFIG.ALTITUDE_CLOUD_FADE_DEPTH;

  // 3. space reveal - faint + hung at top at takeoff; full by deep climb
  const spaceRevealT = smoothstep(1, cloudEnd, m);
  const spaceDeepT = smoothstep(cloudEnd, spaceFull, m);
  const spaceAlpha =
    VIEW_CONFIG.ALTITUDE_SPACE_ALPHA_MIN +
    spaceRevealT *
      (VIEW_CONFIG.ALTITUDE_SPACE_ALPHA_MID -
        VIEW_CONFIG.ALTITUDE_SPACE_ALPHA_MIN) +
    spaceDeepT *
      (1 - VIEW_CONFIG.ALTITUDE_SPACE_ALPHA_MID);
  const spaceY =
    -(1 - spaceRevealT) * h * VIEW_CONFIG.ALTITUDE_SPACE_HANG_RATIO;

  return {
    earthY,
    earthAlpha: clamp01(earthAlpha),
    cloudY,
    cloudAlpha: clamp01(cloudAlpha),
    spaceY,
    spaceAlpha: clamp01(spaceAlpha),
  };
}
