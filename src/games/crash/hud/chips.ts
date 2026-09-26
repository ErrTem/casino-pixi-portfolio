/**
 * Preset bet chip values in display units (D-02 min 10 / max 1000).
 * Data-only — chips fill the bet input; placeBet remains the sole submit path.
 * Omit 1000 to reduce all-in mis-taps; free-form input still allows max 1000.
 */
export const PRESET_CHIPS = [10, 25, 50, 100, 250, 500] as const;

export type PresetChip = (typeof PRESET_CHIPS)[number];
