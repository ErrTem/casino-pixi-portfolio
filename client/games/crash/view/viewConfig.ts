export const VIEW_CONFIG = {
  /** soft outer neon glow */
  GLOW_OUTER_WIDTH: 28,
  GLOW_OUTER_ALPHA: 0.08,
  HALO_WIDTH: 14,
  HALO_ALPHA: 0.16,
  CORE_WIDTH: 3.5,
  CORE_ALPHA: 0.42,
  /**
   * fraction of path length nearest the tip that  visible
   * rest is transp
   */
  TRAIL_VISIBLE_FRACTION: 0.42,
  /** continuous fade */
  TRAIL_FADE_LAYERS: 12,
  CLIMB_COLOR: 0x7667ff,
  CRASH_COLOR: 0xf84f3c,
  /** milder headroom  for plotScaleFor callers; path progress uses SCALE_FLOOR */
  SCALE_HEADROOM: 1.08,
  /**
   * diagonal span reference: progress u=1 at this multiplier (m=1 -> origin)
   * after this  progress continues via log2 PATH_LATE_SPAN
   */
  SCALE_FLOOR: 4.5,
  /**
   * extra diagonal spans added per ×2 past SCALE_FLOOR
   * lower = slower
   */
  PATH_LATE_SPAN: 0.5,
  /** max craft tilt from path tangent */
  TILT_MAX_RAD: Math.PI / 3,
  /**
   * sine wave path: amplitude as a fraction of min
   * offset is applied perpendicular to the diagonal
   */
  PATH_SINE_AMPLITUDE: 0.05,
  /** full sine cycles per SCALE_FLOOR span of progress */
  PATH_SINE_CYCLES: 2.5,
  /**
   * phase offset takeoff  up
   */
  PATH_SINE_PHASE: Math.PI,
  PLOT_TOP_RATIO: 0.36,
  /** base trail samples along path progress */
  SAMPLE_COUNT: 96,
  /** cap on trail samples at high multipliers */
  SAMPLE_COUNT_MAX: 192,
  SEVER_KEEP_RATIO: 0.94,
  /** show crashed x for 3s before fading into the waiting countdown */
  HOLD_MS: 3000,
  FADE_MS: 400,
  FLASH_MS: 160,
  FLASH_PEAK_ALPHA: 0.5,
  BOB_PERIOD_MS: 1400,
  BOB_AMPLITUDE_PX: 4,
  IDLE_CRASH_ALPHA: 0.45,
  /** lower = higher on screen */
  THEATER_Y_RATIO: 0.22,
  /** how long the theater "you win money" banner stays up ( */
  WIN_BANNER_MS: 3000,
  /** brief celebrate scale pop on win banner */
  WIN_CELEBRATE_PEAK_SCALE: 1.18,
  WIN_CELEBRATE_MS: 420,
  /** warm gold tint while win banner is active */
  WIN_BANNER_TINT: 0xffc14a,
  /** screen X fraction where craft tip is locked during climb */
  CAMERA_CENTER_X_RATIO: 0.55,
  /** screen Y fraction where craft tip is locked during climb*/
  CAMERA_CENTER_Y_RATIO: 0.52,
  /** exponential follow time constant  for world.position tip lock */
  CAMERA_LERP_TAU_MS: 140,
  FROZEN_OFFSET_PX: 48,
  /** сraft length in plot pixels*/
  ROCKET_LENGTH_PX: 156,
  /**
   * texture forward axis vs local +x
   */
  ROCKET_TEXTURE_ANGLE: 0,
  /** animatedSprite playback speed for the 2 frame ship loop */
  ROCKET_ANIM_SPEED: 0.14,
  /** crash explosion size in plot pixels */
  EXPLOSION_SIZE_PX: 575,
  /** one shot circle explosion playback speed ~10 frames */
  EXPLOSION_ANIM_SPEED: 0.28,
  BACKGROUND: 0x161648,
  /** parallax cloud sprite tint */
  CLOUD_TINT: 0x3a386a,
  CLOUD_ALPHA: 0.28,
  /** screen-fixed ground strip cloud hue */
  GROUND_COLOR: 0x4540a0,
  GROUND_HEIGHT_RATIO: 0.055,
  GROUND_LIP_COLOR: 0x5550b8,
  GROUND_LIP_PX: 2,
  TREE_TINT: 0x3a386a,
  TREE_ALPHA: 0.55,
  /** tree height as fraction of screen height (desktop) */
  TREE_HEIGHT_RATIO: 0.09,
  /** tree height as fraction of screen height ( mobile) */
  TREE_HEIGHT_RATIO_MOBILE: 0.055,
  TREE_MOBILE_MAX_W: 720,
  /** far / mid / near star-dust wrap periods intensity 0 */
  PARALLAX_FAR_PERIOD_MS: 72_000,
  PARALLAX_MID_PERIOD_MS: 42_000,
  PARALLAX_NEAR_PERIOD_MS: 22_000,
  /** at full intensity  scroll rate multiplies by this */
  PARALLAX_SPEED_BOOST: 8,
  /** multiplier where parallax speed boost saturates */
  PARALLAX_INTENSITY_AT: 100,
  /**
   * height bands climb multiplier -> backdrop altitude pose
   * earth exits by ALTITUDE_EARTH_END_M; clouds scroll until ALTITUDE_CLOUD_END_M;
   * space is fully settled/bright by ALTITUDE_SPACE_FULL_M
   */
  ALTITUDE_EARTH_END_M: 10,
  ALTITUDE_CLOUD_END_M: 30,
  ALTITUDE_SPACE_FULL_M: 100,
  /** earth group slides this fraction of screen height off the bottom by earth end */
  ALTITUDE_EARTH_SLIDE_RATIO: 0.42,
  /** cloud group drifts this fraction of screen height downward by cloud end */
  ALTITUDE_CLOUD_SCROLL_RATIO: 0.55,
  /** how much clouds fade toward deep space (0 = stay 1 = gone) */
  ALTITUDE_CLOUD_FADE_DEPTH: 0.85,
  /** space starts this fraction of screen height above the viewport */
  ALTITUDE_SPACE_HANG_RATIO: 0.12,
  /** space alpha at takeoff */
  ALTITUDE_SPACE_ALPHA_MIN: 0.3,
  /** space alpha once cloud band ends (before deep space ramp to 1) */
  ALTITUDE_SPACE_ALPHA_MID: 0.8,
  /** live x scale pulse on whole number crossing */
  PULSE_PEAK_SCALE: 1.12,
  PULSE_DURATION_MS: 180,
  /** base live x scale grows from 1 -> this as mult approaches LIVE_SCALE_AT_M */
  LIVE_SCALE_MAX: 1.55,
  /** multiplier where live  base scale growth begins */
  LIVE_SCALE_START_M: 3,
  /** multiplier where live  base scale saturates */
  LIVE_SCALE_AT_M: 40,
  /** pendulum amplitude for live x rotation */
  LIVE_SWAY_DEG: 15,
  /** full +amp->−amp->+amp cycle duration at constant angular speed */
  LIVE_SWAY_PERIOD_MS: 4800,
  /** sway starts only after this multiplier */
  LIVE_SWAY_START_M: 10,
  /** multiplier where spark rain starts (full  LIVE_SPARK_AT_M)*/
  LIVE_SPARK_START_M: 3,
  LIVE_SPARK_AT_M: 15,
  /** hard capped spark pool hanging off live × */
  LIVE_SPARK_POOL: 28,
  /** spawn attempts per second at full spark intensity */
  LIVE_SPARK_SPAWN_PER_SEC: 18,
  /** white -> gold/fire tint ramp starts after this multiplier */
  TINT_GOLD_START_M: 10,
  TINT_NEAR_WHITE: 0xf3f0ff,
  TINT_GOLD: 0xffc14a,
  TINT_FIRE: 0xff7a18,
  /** multiplier where gold->fire lerp completes */
  TINT_FIRE_AT_M: 25,


  // /** blur after multiplier  */
  // SPEED_BLUR_START_M: 15,
  // /**  strength saturate */
  // SPEED_BLUR_AT_M: 35,
  // /** max horizontal / vertical blur strength  */
  // SPEED_BLUR_STRENGTH_X: 3,
  // SPEED_BLUR_STRENGTH_Y: 1.2,
  // SPEED_BLUR_QUALITY: 3,
} as const;

export type ViewConfig = typeof VIEW_CONFIG;
