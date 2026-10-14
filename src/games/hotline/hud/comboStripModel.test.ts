import { describe, expect, it } from "vitest";
import type { NightPathEntry } from "../logic/index.js";
import { buildComboStripCells } from "./comboStripModel.js";

describe("buildComboStripCells (D-18)", () => {
  it("marks activeIndex cell active with prior done and later pending", () => {
    const path: NightPathEntry[] = [
      { color: "green", nested: false, state: "done" },
      { color: "red", nested: false, state: "active" },
      { color: "purple", nested: false, state: "pending" },
    ];
    const cells = buildComboStripCells(path, 1);
    expect(cells).toHaveLength(3);
    expect(cells[0]).toEqual({ label: "Green", state: "done" });
    expect(cells[1]).toEqual({ label: "Red", state: "active" });
    expect(cells[2]).toEqual({ label: "Purple", state: "pending" });
  });

  it("labels nested entries with a nested suffix", () => {
    const path: NightPathEntry[] = [
      { color: "green", nested: false, state: "paused" },
      { color: "red", nested: true, state: "active" },
      { color: "purple", nested: true, state: "pending" },
    ];
    const cells = buildComboStripCells(path, 1);
    expect(cells).toHaveLength(3);
    expect(cells[0].label).toMatch(/Green/i);
    expect(cells[1].label).toMatch(/Red/i);
    expect(cells[1].label).toMatch(/nested/i);
    expect(cells[1].state).toBe("active");
    expect(cells[2].label).toMatch(/Purple/i);
    expect(cells[2].label).toMatch(/nested/i);
    expect(cells[2].state).toBe("pending");
  });

  it("returns empty cells for an empty path", () => {
    expect(buildComboStripCells([], -1)).toEqual([]);
  });
});
