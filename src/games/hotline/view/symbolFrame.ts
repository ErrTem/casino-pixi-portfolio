/** high ids that get witch-pots style neon cell frames */
export const HIGH_FRAME_IDS = ["mask", "cassette", "pistol", "car"] as const;

export type HighFrameId = (typeof HIGH_FRAME_IDS)[number];

const FRAME_COLORS: Readonly<Record<HighFrameId, number>> = {
  mask: 0xffc857,
  cassette: 0xff2e93,
  pistol: 0x4de8ff,
  car: 0xff3355,
};

export function isHighFrameSymbol(id: string): id is HighFrameId {
  return (HIGH_FRAME_IDS as readonly string[]).includes(id);
}

/** palette hex for a high symbol, undefined for lows */
export function frameColorFor(id: string): number | undefined {
  if (!isHighFrameSymbol(id)) return undefined;
  return FRAME_COLORS[id];
}
