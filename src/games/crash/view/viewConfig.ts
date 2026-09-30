/** Named tunables for Crash Pixi view (D-01..D-20). View-only — not settlement. */
export const VIEW_CONFIG = {
  /** Soft outer neon glow (widest). */
  GLOW_OUTER_WIDTH: 28,
  GLOW_OUTER_ALPHA: 0.08,
  HALO_WIDTH: 14,
  HALO_ALPHA: 0.16,
  CORE_WIDTH: 3.5,
  CORE_ALPHA: 0.42,
  /**
   * Fraction of path length nearest the tip that stays visible.
   * The rest of the tail is fully gone (alpha 0).
   */
  TRAIL_VISIBLE_FRACTION: 0.42,
  /** Soft additive layers for a continuous fade (avoids per-segment "dots"). */
  TRAIL_FADE_LAYERS: 12,
  CLIMB_COLOR: 0x7667ff,
  CRASH_COLOR: 0xf84f3c,
  /** Milder headroom — kept for plotScaleFor callers; path progress uses SCALE_FLOOR. */
  SCALE_HEADROOM: 1.08,
  /**
   * Diagonal span reference: progress u=1 at this multiplier (m=1 → origin).
   * Past this, progress continues via log2 (PATH_LATE_SPAN per doubling).
   */
  SCALE_FLOOR: 4.5,
  /**
   * Extra diagonal spans added per ×2 past SCALE_FLOOR.
   * Lower = slower late climb (high × no longer rockets along the path).
   */
  PATH_LATE_SPAN: 0.5,
  /** Max craft tilt from path tangent — wide enough to follow the sine wave. */
  TILT_MAX_RAD: Math.PI / 3,
  /**
   * Sine-wave path: amplitude as a fraction of min(plot width, height).
   * Offset is applied perpendicular to the diagonal.
   */
  PATH_SINE_AMPLITUDE: 0.05,
  /** Full sine cycles per SCALE_FLOOR span of progress (keeps waving past 5×). */
  PATH_SINE_CYCLES: 2.5,
  /**
   * Phase offset (radians). π flips the first lobe so takeoff arcs up, not down.
   */
  PATH_SINE_PHASE: Math.PI,
  PLOT_TOP_RATIO: 0.36,
  /** Base trail samples along path progress. */
  SAMPLE_COUNT: 96,
  /** Cap on trail samples at high multipliers. */
  SAMPLE_COUNT_MAX: 192,
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
  /** Craft length in plot pixels (sprite scaled to this). */
  ROCKET_LENGTH_PX: 156,
  /**
   * Texture forward axis vs local +X. Saucer art faces +X already.
   */
  ROCKET_TEXTURE_ANGLE: 0,
  /** AnimatedSprite playback speed for the 3-frame ship loop. */
  ROCKET_ANIM_SPEED: 0.12,
  /** Crash explosion size in plot pixels. */
  EXPLOSION_SIZE_PX: 275,
  /** One-shot circle explosion playback speed (~10 frames). */
  EXPLOSION_ANIM_SPEED: 0.28,
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
  PARALLAX_SPEED_BOOST: 3,
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
  SPEED_BLUR_START_M: 15,
  /** Multiplier where speed-blur strength saturates. */
  SPEED_BLUR_AT_M: 35,
  /** Max horizontal / vertical blur strength (motion-speed feel). */
  SPEED_BLUR_STRENGTH_X: 3,
  SPEED_BLUR_STRENGTH_Y: 1.2,
  SPEED_BLUR_QUALITY: 3,
} as const;

export type ViewConfig = typeof VIEW_CONFIG;
