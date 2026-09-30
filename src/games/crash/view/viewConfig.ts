/** Named tunables for Crash Pixi view (D-01..D-20). View-only — not settlement. */
export const VIEW_CONFIG = {
  HALO_WIDTH: 16,
  HALO_ALPHA: 0.35,
  CORE_WIDTH: 4,
  CLIMB_COLOR: 0x7667ff,
  CRASH_COLOR: 0xf84f3c,
  /** Milder headroom — tip travels farther before rescale. */
  SCALE_HEADROOM: 1.08,
  /** Higher floor keeps early climb on a fixed scale (smooth left→right takeoff). */
  SCALE_FLOOR: 4.5,
  /**
   * Blend weight toward linear X in plotPoint (0 = pure log2-X, 1 = fully linear).
   * Higher linear blend = smoother takeoff travel.
   */
  PLOT_X_LINEAR_BLEND: 0.72,
  /** Max craft tilt from path tangent (±12°). */
  TILT_MAX_RAD: Math.PI / 15,
  PLOT_TOP_RATIO: 0.36,
  SAMPLE_COUNT: 64,
  SEVER_KEEP_RATIO: 0.94,
  /** Show Crashed × for 3s before fading into the waiting countdown. */
  HOLD_MS: 3000,
  FADE_MS: 400,
  FLASH_MS: 160,
  FLASH_PEAK_ALPHA: 0.5,
  BOB_PERIOD_MS: 1400,
  BOB_AMPLITUDE_PX: 4,
  IDLE_CRASH_ALPHA: 0.45,
  THEATER_Y_RATIO: 0.4,
  /** Screen X fraction where craft tip is locked during climb (slight right bias). */
  CAMERA_CENTER_X_RATIO: 0.55,
  /** Screen Y fraction where craft tip is locked during climb. */
  CAMERA_CENTER_Y_RATIO: 0.52,
  /** Exponential follow time-constant (ms) for world.position tip lock. */
  CAMERA_LERP_TAU_MS: 140,
  FROZEN_OFFSET_PX: 48,
  ROCKET_LENGTH_PX: 28,
  BACKGROUND: 0x161648,
} as const;

export type ViewConfig = typeof VIEW_CONFIG;
