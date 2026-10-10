import type { NightPathEntry } from "../logic/index.js";

export type ComboStripCell = {
  label: string;
  state: "active" | "done" | "pending";
};

// stub: real path highlight lands in 04-05 green
export function buildComboStripCells(
  _path: readonly NightPathEntry[],
  _activeIndex: number,
): ComboStripCell[] {
  return [];
}
