import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..");
const LOGIC_DIRS = [
  join(ROOT, "src", "games", "crash", "logic"),
  join(ROOT, "src", "shared"),
];

/** Forbidden canvas-renderer package import (ARCH-02). */
const PIXI_IMPORT =
  /(?:from|import)\s+['"]pixi\.js['"]|require\(\s*['"]pixi\.js['"]\s*\)/;

/** Browser globals must not appear in pure logic (ARCH-02). */
const DOM_API = /\b(?:document|window)\s*\./;

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...collectTsFiles(full));
    else if (name.endsWith(".ts")) out.push(full);
  }
  return out;
}

describe("architecture — ARCH-02 pure logic boundary", () => {
  it("logic and shared sources must not import pixi.js or use document/window", () => {
    const files = LOGIC_DIRS.flatMap(collectTsFiles);
    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      const rel = relative(ROOT, file).replace(/\\/g, "/");
      if (PIXI_IMPORT.test(src)) {
        violations.push(`${rel}: forbidden pixi.js import`);
      }
      if (DOM_API.test(src)) {
        violations.push(`${rel}: forbidden document./window. usage`);
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("package.json must not list pixi.js or vite dependencies", () => {
    const pkg = JSON.parse(
      readFileSync(join(ROOT, "package.json"), "utf8"),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const names = new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ]);
    expect(names.has("pixi.js")).toBe(false);
    expect(names.has("vite")).toBe(false);
  });
});
