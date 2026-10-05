import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..");
const LOGIC_DIRS = [
  join(ROOT, "src", "games", "crash", "logic"),
  join(ROOT, "src", "shared"),
];
const VIEW_DIR = join(ROOT, "src", "games", "crash", "view");
/** T-03-08: scene mount path must not network-load; Rocket may load via loadRocketTextures. */
const NO_ASSETS_LOAD_FILES = [
  join(VIEW_DIR, "CrashScene.ts"),
  join(VIEW_DIR, "mountCrashView.ts"),
];
/** T-03-07: theater strings are BitmapText.text from formatMult - never DOM HTML. */
const THEATER_FILES = [
  join(VIEW_DIR, "TheaterText.ts"),
  join(VIEW_DIR, "CrashScene.ts"),
];

/** Forbidden canvas-renderer package import (ARCH-02). */
const PIXI_IMPORT =
  /(?:from|import)\s+['"]pixi\.js['"]|require\(\s*['"]pixi\.js['"]\s*\)/;

/** Browser globals must not appear in pure logic (ARCH-02). */
const DOM_API = /\b(?:document|window)\s*\./;

/**
 * XSS / DOM text injection usage (T-03-07).
 * Matches executable `.innerHTML` access/assignment - not prose in comments that ban it.
 */
const INNER_HTML_USE = /\.innerHTML\b/;

/** Network texture load ban on rocket seam (T-03-08). */
const ASSETS_LOAD = /\bAssets\s*\.\s*load\b/;

/** Strip line and block comments so ban-prose does not false-positive source scans. */
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

describe("architecture - ARCH-02 pure logic boundary", () => {
  it("logic and shared sources must not import pixi.js or use document/window", () => {
    const files = LOGIC_DIRS.flatMap(collectTsFiles);
    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];
    for (const file of files) {
      const { rel, src } = readRel(file);
      if (PIXI_IMPORT.test(src)) {
        violations.push(`${rel}: forbidden pixi.js import`);
      }
      if (DOM_API.test(src)) {
        violations.push(`${rel}: forbidden document./window. usage`);
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("package.json lists pixi.js@8.21.0 (Phase 3 hybrid view)", () => {
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
    expect(names.has("pixi.js")).toBe(true);
    expect(pkg.dependencies?.["pixi.js"]).toBe("8.21.0");
  });
});

describe("architecture - T-03-07 theater text is formatMult -> BitmapText.text", () => {
  it("TheaterText uses BitmapText and assigns .text; no .innerHTML use", () => {
    const { src, code } = readRel(join(VIEW_DIR, "TheaterText.ts"));
    expect(src).toMatch(/\bBitmapText\b/);
    expect(src).toMatch(/\blive\.text\s*=/);
    expect(src).toMatch(/\bfrozen\.text\s*=/);
    expect(INNER_HTML_USE.test(code)).toBe(false);
    expect(code).not.toMatch(/\bHTMLText\b/);
  });

  it("CrashScene builds theater strings via formatMult and never uses .innerHTML", () => {
    const { src, code } = readRel(join(VIEW_DIR, "CrashScene.ts"));
    expect(src).toMatch(
      /import\s+\{\s*formatMult\s*\}\s+from\s+['"]\.\.\/hud\/format\.js['"]/,
    );
    expect(src).toMatch(/formatMult\s*\(/);
    expect(src).toMatch(/theater\.sync\s*\(/);
    expect(INNER_HTML_USE.test(code)).toBe(false);
  });

  it("view theater sources ban .innerHTML usage (T-03-07)", () => {
    const violations: string[] = [];
    for (const file of THEATER_FILES) {
      const { rel, code } = readRel(file);
      if (INNER_HTML_USE.test(code)) {
        violations.push(`${rel}: forbidden .innerHTML usage`);
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});

describe("architecture - T-03-08 rocket seam has no Assets.load", () => {
  it("CrashScene and mountCrashView must not call Assets.load", () => {
    const violations: string[] = [];
    for (const file of NO_ASSETS_LOAD_FILES) {
      const { rel, code } = readRel(file);
      if (ASSETS_LOAD.test(code)) {
        violations.push(`${rel}: forbidden Assets.load`);
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("Rocket exposes setBodyTexture seam; Assets.load only in loadRocketTextures helpers", () => {
    const { src, code } = readRel(join(VIEW_DIR, "Rocket.ts"));
    expect(src).toMatch(/\bsetBodyTexture\b/);
    expect(src).toMatch(/\bbodySprite\b/);
    expect(src).toMatch(/\bbodyGraphics\b/);
    expect(src).toMatch(/\bloadRocketTextures\b/);
    expect(code).not.toMatch(/\bParticleContainer\b/);
    // Assets.load allowed only inside the dedicated loader helpers.
    const withoutLoaders = code
      .replace(
        /export async function loadRocketTextures[\s\S]*?(?=export async function loadRocketTexture|$)/,
        "",
      )
      .replace(
        /export async function loadRocketTexture[\s\S]*$/,
        "",
      );
    expect(ASSETS_LOAD.test(withoutLoaders)).toBe(false);
  });
});
