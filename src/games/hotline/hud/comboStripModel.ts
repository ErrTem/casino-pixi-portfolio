import type { NightPathEntry } from "../logic/index.js";
import type { TokenColor } from "../logic/collectors/TokenColors.js";

export type ComboStripCell = {
  label: string;
  state: "active" | "done" | "pending";
};

const COLOR_LABEL: Record<TokenColor, string> = {
  green: "Green",
  red: "Red",
  purple: "Purple",
};

function cellState(
  entry: NightPathEntry,
  index: number,
  activeIndex: number,
): ComboStripCell["state"] {
  if (index === activeIndex || entry.state === "active") return "active";
  if (entry.state === "done") return "done";
  if (entry.state === "paused") return "done";
  if (activeIndex >= 0 && index < activeIndex) return "done";
  return "pending";
}

// map night path plus active index to hud strip cells
export function buildComboStripCells(
  path: readonly NightPathEntry[],
  activeIndex: number,
): ComboStripCell[] {
  return path.map((entry, index) => {
    const base = COLOR_LABEL[entry.color];
    const label = entry.nested ? `${base} nested` : base;
    return {
      label,
      state: cellState(entry, index, activeIndex),
    };
  });
}
