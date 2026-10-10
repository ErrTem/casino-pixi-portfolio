import { TOKEN_COLOR_ORDER, type TokenColor } from "../logic/collectors/TokenColors.js";
import type { CollectorSpawn } from "../logic/collectors/resolveCollectors.js";

export type MeterBaseline = Record<TokenColor, number>;

const COLOR_LABEL: Record<TokenColor, string> = {
  green: "Green",
  red: "Red",
  purple: "Purple",
};

// soft-cap display fills from a pre-spin baseline plus landed spawns so far
export function progressiveDisplayFills(
  baseline: MeterBaseline,
  landed: readonly CollectorSpawn[],
  meterTarget: number,
): number[] {
  const counts: MeterBaseline = {
    green: baseline.green,
    red: baseline.red,
    purple: baseline.purple,
  };
  for (const spawn of landed) {
    counts[spawn.color] += 1;
  }
  const cap = Number.isFinite(meterTarget) ? Math.max(0, Math.floor(meterTarget)) : 0;
  return TOKEN_COLOR_ORDER.map((color) => Math.min(counts[color], cap));
}

// combo strip copy, fixed green to red to purple order already in queue
export function formatComboStrip(queue: readonly TokenColor[]): string {
  if (queue.length === 0) return "";
  return `COMBO: ${queue.map((c) => COLOR_LABEL[c]).join(" → ")}`;
}

export function baselineFromMeterFills(
  fills: Record<TokenColor, { count: number; display: number }>,
): MeterBaseline {
  return {
    green: fills.green.count,
    red: fills.red.count,
    purple: fills.purple.count,
  };
}
