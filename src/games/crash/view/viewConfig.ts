/** Named tunables for Crash Pixi view (D-01..D-20). View-only — not settlement. */
export const VIEW_CONFIG = {
  HALO_WIDTH: 16,
  HALO_ALPHA: 0.35,
  CORE_WIDTH: 4,
  CLIMB_COLOR: 0x3dff8a,
  CRASH_COLOR: 0xff3b4e,
  /** Milder than Phase 3 1.25 so tip motion stays smooth under arcade camera (D-16). */
  SCALE_HEADROOM: 1.25,
  SCALE_FLOOR: 2,
  /**
   * Blend weight toward linear X in plotPoint (0 = pure log2-X Phase 3, 1 = fully linear).
   * Soft arcade scroll uses a mid blend (D-16). Stub 0 until GREEN softens mapping.
   */
  PLOT_X_LINEAR_BLEND: 0,
  /** Max craft tilt from path tangent (±15°) — D-18 gentle tilt. */
  TILT_MAX_RAD: Math.PI / 12,
  PLOT_TOP_RATIO: 0.36,
  SAMPLE_COUNT: 64,
  SEVER_KEEP_RATIO: 0.94,
  HOLD_MS: 1000,
  FADE_MS: 400,
  FLASH_MS: 160,
  FLASH_PEAK_ALPHA: 0.5,
  BOB_PERIOD_MS: 1400,
  BOB_AMPLITUDE_PX: 4,
  IDLE_CRASH_ALPHA: 0.45,
  THEATER_Y_RATIO: 0.18,
  FROZEN_OFFSET_PX: 48,
  ROCKET_LENGTH_PX: 28,
  BACKGROUND: 0x070b14,
} as const;

export type ViewConfig = typeof VIEW_CONFIG;
