import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..");
const SHELL_SCAN_DIRS = [
  join(ROOT, "src", "shell"),
  join(ROOT, "src", "games", "crash", "session"),
];
const SESSION_FILE = join(
  ROOT,
  "src",
  "games",
  "crash",
  "session",
  "mountCrashSession.ts",
);
const HUD_FILE = join(ROOT, "src", "games", "crash", "hud", "CrashHud.ts");

const INNER_HTML_USE = /\.innerHTML\b/;

function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...collectTsFiles(full));
    else if (name.endsWith(".ts") && !name.endsWith(".test.ts")) out.push(full);
  }
  return out;
}

function readRel(file: string): { rel: string; src: string; code: string } {
  const src = readFileSync(file, "utf8");
  return {
    rel: relative(ROOT, file).replace(/\\/g, "/"),
    src,
    code: stripComments(src),
  };
}

describe("architecture - SHELL-02 leak-free leave and D-12 shell resources", () => {
  it("Gate A: no .innerHTML use under src/shell or crash session", () => {
    const files = SHELL_SCAN_DIRS.flatMap(collectTsFiles);
    expect(files.length).toBeGreaterThan(0);
    const violations: string[] = [];
    for (const file of files) {
      const { rel, code } = readRel(file);
      if (INNER_HTML_USE.test(code)) {
        violations.push(`${rel}: forbidden .innerHTML usage`);
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("Gate B: mountCrashSession teardown order and no shell resource dispose", () => {
    const { code } = readRel(SESSION_FILE);
    expect(code).toMatch(/ticker\s*\.\s*remove\s*\(/);
    expect(code).toMatch(/hud\s*\.\s*dispose\s*\(/);
    expect(code).toMatch(/scene\s*\.\s*destroy\s*\(/);
    expect(code).toMatch(/resizeTo\s*=\s*null/);
    expect(code).toMatch(/\.stop\s*\(/);
    expect(code).toMatch(/canvas\s*\.\s*remove\s*\(/);
    expect(code).not.toMatch(/\baudio\s*\.\s*dispose\s*\(/);
    expect(code).not.toMatch(/ctx\.audio\.dispose/);
    expect(code).not.toMatch(/\bapp\s*\.\s*destroy\s*\(/);
  });

  it("Gate C: CrashHud declares dispose and removes keydown by name", () => {
    const { src, code } = readRel(HUD_FILE);
    expect(src).toMatch(/dispose\s*\(\s*\)\s*:\s*void/);
    expect(code).toMatch(/removeEventListener\s*\(\s*["']keydown["']/);
  });
});
