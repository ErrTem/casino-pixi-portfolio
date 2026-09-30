/** Named tunables for Crash Pixi view (D-01..D-20). View-only — not settlement. */
export const VIEW_CONFIG = {
  /** Soft outer neon glow (widest). */
  GLOW_OUTER_WIDTH: 28,
  GLOW_OUTER_ALPHA: 0.08,
  HALO_WIDTH: 14,
  HALO_ALPHA: 0.16,
  CORE_WIDTH: 3.5,
  CORE_ALPHA: 0.42,
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
  /** Parallax cloud sprite tint (was ellipse fill 0x3a386a @ 0.28). */
  CLOUD_TINT: 0x3a386a,
  CLOUD_ALPHA: 0.28,
  /** Screen-fixed ground strip — cloud hue, slightly more saturated. */
  GROUND_COLOR: 0x4540a0,
  GROUND_HEIGHT_RATIO: 0.055,
  GROUND_LIP_COLOR: 0x5550b8,
  GROUND_LIP_PX: 2,
  /** Trees on ground — same hue as clouds, slightly more opaque. */
  TREE_TINT: 0x3a386a,
  TREE_ALPHA: 0.55,
  /** Tree height as fraction of screen height (desktop). */
  TREE_HEIGHT_RATIO: 0.09,
  /** Tree height as fraction of screen height (narrow / mobile). */
  TREE_HEIGHT_RATIO_MOBILE: 0.055,
  /** Match HUD mobile breakpoint — fewer/smaller trees below this width. */
  TREE_MOBILE_MAX_W: 720,
  /** Far / mid / near star-dust wrap periods (ms) at intensity 0. */
  PARALLAX_FAR_PERIOD_MS: 72_000,
  PARALLAX_MID_PERIOD_MS: 42_000,
  PARALLAX_NEAR_PERIOD_MS: 22_000,
  /** At full intensity, scroll rate multiplies by this (smooth — no period remaps). */
  PARALLAX_SPEED_BOOST: 8,
  /** Multiplier where parallax speed boost saturates. */
  PARALLAX_INTENSITY_AT: 25,
  /** Live × scale pulse on whole-number crossings. */
  PULSE_PEAK_SCALE: 1.12,
  PULSE_DURATION_MS: 180,
  /** Base live × scale grows from 1 → this as mult approaches LIVE_SCALE_AT_M. */
  LIVE_SCALE_MAX: 1.55,
  /** Multiplier where live × base scale growth begins. */
  LIVE_SCALE_START_M: 3,
  /** Multiplier where live × base scale saturates. */
  LIVE_SCALE_AT_M: 40,
  /** Pendulum amplitude for live × rotation (degrees). */
  LIVE_SWAY_DEG: 15,
  /** Full +amp→−amp→+amp cycle duration (ms) at constant angular speed. */
  LIVE_SWAY_PERIOD_MS: 4800,
  /** Sway starts only after this multiplier (ramps in smoothly). */
  LIVE_SWAY_START_M: 10,
  /** Multiplier where spark rain starts (ramps to full by LIVE_SPARK_AT_M). */
  LIVE_SPARK_START_M: 3,
  LIVE_SPARK_AT_M: 15,
  /** Hard-capped spark pool hanging off live ×. */
  LIVE_SPARK_POOL: 28,
  /** Spawn attempts per second at full spark intensity. */
  LIVE_SPARK_SPAWN_PER_SEC: 18,
  /** White → gold/fire tint ramp starts after this multiplier. */
  TINT_GOLD_START_M: 10,
  TINT_NEAR_WHITE: 0xf3f0ff,
  TINT_GOLD: 0xffc14a,
  TINT_FIRE: 0xff7a18,
  /** Multiplier where gold→fire lerp completes. */
  TINT_FIRE_AT_M: 25,
  /** Backdrop speed-blur starts after this multiplier. */
  SPEED_BLUR_START_M: 10,
  /** Multiplier where speed-blur strength saturates. */
  SPEED_BLUR_AT_M: 25,
  /** Max horizontal / vertical blur strength (motion-speed feel). */
  SPEED_BLUR_STRENGTH_X: 6,
  SPEED_BLUR_STRENGTH_Y: 1.2,
  SPEED_BLUR_QUALITY: 3,
} as const;

export type ViewConfig = typeof VIEW_CONFIG;
