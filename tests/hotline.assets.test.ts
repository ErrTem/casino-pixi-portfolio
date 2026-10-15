import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DISKETTE_URLS,
  HOTLINE_ASSET_URLS,
  SYMBOL_URLS,
} from "../client/games/hotline/view/loadHotlineAssets.js";
import { loadHotlineConfig } from "../math/hotline/config/loadHotlineConfig.js";

const ROOT = process.cwd();
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// every file the 02-ASSET-LIST must-have and paying tables name
const ASSET_LIST_FILES = [
  "backdrop-rooftop.png",
  "frame-crt.png",
  "phones-cassette-strip.png",
  "diskette-green.png",
  "diskette-red.png",
  "diskette-purple.png",
  "sym-wild-mask.png",
  "sym-hi-pistol.png",
  "sym-hi-cassette.png",
  "sym-hi-car.png",
  "sym-lo-ace.png",
  "sym-lo-king.png",
  "sym-lo-queen.png",
  "sym-lo-jack.png",
  "sym-lo-ten.png",
];

function fileForUrl(url: string): string {
  // urls are served from public/
  return join(ROOT, "public", url);
}

describe("hotline asset pack", () => {
  it("loader url list covers every asset list file", () => {
    const names = HOTLINE_ASSET_URLS.map((u) => u.split("/").pop());
    for (const file of ASSET_LIST_FILES) {
      expect(names).toContain(file);
    }
    expect(HOTLINE_ASSET_URLS).toHaveLength(ASSET_LIST_FILES.length);
  });

  it("every loader url is a real png on disk", () => {
    for (const url of HOTLINE_ASSET_URLS) {
      const bytes = readFileSync(fileForUrl(url));
      const head = Array.from(bytes.subarray(0, PNG_SIGNATURE.length));
      expect(head, url).toEqual(PNG_SIGNATURE);
    }
  });

  it("every config symbol id has a texture url", () => {
    const ids = Object.keys(loadHotlineConfig().math.symbolWeights[0]);
    for (const id of ids) {
      expect(SYMBOL_URLS[id], id).toBeTruthy();
    }
  });

  it("diskette urls cover green red purple", () => {
    expect(DISKETTE_URLS.green).toContain("diskette-green.png");
    expect(DISKETTE_URLS.red).toContain("diskette-red.png");
    expect(DISKETTE_URLS.purple).toContain("diskette-purple.png");
    for (const url of Object.values(DISKETTE_URLS)) {
      expect(HOTLINE_ASSET_URLS).toContain(url);
    }
  });
});

