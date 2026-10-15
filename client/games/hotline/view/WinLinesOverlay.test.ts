import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("WinLinesOverlay clear blanks callout (u99)", () => {
  it("clear assigns empty label text before draw", () => {
    const src = readFileSync(join(import.meta.dirname, "WinLinesOverlay.ts"), "utf8");
    const clearAt = src.indexOf("clear(): void");
    expect(clearAt).toBeGreaterThan(0);
    const nextMethod = src.indexOf("\n    destroy():", clearAt);
    const body = src.slice(clearAt, nextMethod > clearAt ? nextMethod : clearAt + 300);
    expect(body).toMatch(/label\.text\s*=\s*["']["']/);
    expect(body).toMatch(/draw\s*\(/);
  });
});
