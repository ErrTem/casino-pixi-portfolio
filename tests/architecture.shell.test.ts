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
const HOTLINE_SESSION_FILE = join(
  ROOT,
  "src",
  "games",
  "hotline",
  "session",
  "mountHotlineSession.ts",
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

  it("Gate B2: mountHotlineSession loads config first, tears down like crash, keeps shell resources", () => {
    const { code } = readRel(HOTLINE_SESSION_FILE);
    expect(code).toMatch(/loadHotlineConfig\s*\(/);
    expect(code).toMatch(/createHotlineGame\s*\(/);
    expect(code.indexOf("loadHotlineConfig(")).toBeLessThan(
      code.indexOf("createHotlineGame("),
    );
    expect(code).toMatch(/ticker\s*\.\s*remove\s*\(/);
    expect(code).toMatch(/hud\s*\.\s*dispose\s*\(/);
    expect(code).toMatch(/scene\s*\.\s*destroy\s*\(/);
    expect(code).toMatch(/resizeTo\s*=\s*null/);
    expect(code).toMatch(/\.stop\s*\(/);
    expect(code).toMatch(/canvas\s*\.\s*remove\s*\(/);
    expect(code).not.toMatch(/\baudio\s*\.\s*dispose\s*\(/);
    expect(code).not.toMatch(/\bapp\s*\.\s*destroy\s*\(/);
    expect(code).not.toMatch(/\.innerHTML\b/);
  });

  it("Gate B3: hotline reels are first party and the session wires spin and reel_stop beeps", () => {
    const { code } = readRel(HOTLINE_SESSION_FILE);
    expect(code).toMatch(/play\(\s*"spin"\s*\)/);
    expect(code).toMatch(/play\(\s*"reel_stop"\s*\)/);
    const scene = readRel(
      join(ROOT, "src", "games", "hotline", "view", "HotlineScene.ts"),
    );
    expect(scene.code).toMatch(/createReelWindow/);
    const reelFiles = collectTsFiles(
      join(ROOT, "src", "games", "hotline", "view", "reels"),
    );
    expect(reelFiles.length).toBeGreaterThan(0);
    const pkg = readFileSync(join(ROOT, "package.json"), "utf8");
    expect(pkg).not.toMatch(/pixi-reels|"gsap"|"howler"/);
    for (const file of reelFiles) {
      expect(readRel(file).code).not.toMatch(/from\s+["'](gsap|howler|pixi-reels)/);
    }
  });

  it("Gate B4: hotline win feedback cycles lines, tweens last win and plays win after settle", () => {
    const session = readRel(HOTLINE_SESSION_FILE);
    expect(session.code).toMatch(/play\(\s*"win"\s*\)/);
    const scene = readRel(
      join(ROOT, "src", "games", "hotline", "view", "HotlineScene.ts"),
    );
    expect(scene.code).toMatch(/createWinLinesOverlay/);
    expect(scene.code).toMatch(/overlay\s*\.\s*destroy\s*\(/);
    const hud = readRel(
      join(ROOT, "src", "games", "hotline", "hud", "HotlineHud.ts"),
    );
    expect(hud.code).toMatch(/lastWinTweenValue|createLastWinTween/);
  });

  it("Gate C: CrashHud declares dispose and removes keydown by name", () => {
    const { src, code } = readRel(HUD_FILE);
    expect(src).toMatch(/dispose\s*\(\s*\)\s*:\s*void/);
    expect(code).toMatch(/removeEventListener\s*\(\s*["']keydown["']/);
  });
});
