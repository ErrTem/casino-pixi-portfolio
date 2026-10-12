import { Container, Graphics, Sprite, Text, type Application } from "pixi.js";
import type { HotlineConfig } from "../config/HotlineConfigSchema.js";
import type { CollectorSpawn } from "../logic/collectors/resolveCollectors.js";
import type { TokenColor } from "../logic/collectors/TokenColors.js";
import type { HoldSnapshot, HotlineSnapshot, JackpotTier } from "../logic/index.js";
import { createHoldLayer } from "./HoldLayer.js";
import { createJackpotStrip } from "./JackpotStrip.js";
import type { HotlineTextures } from "./loadHotlineAssets.js";
import { createPhonesLayer } from "./PhonesLayer.js";
import { createReelWindow } from "./reels/createReelWindow.js";
import { createTokenFlight } from "./TokenFlight.js";
import {
  createWinLinesOverlay,
  type WinGeometry,
} from "./WinLinesOverlay.js";

export interface HotlineSceneHooks {
  /** fires as each reel lands, left to right */
  onReelStop?: (reelIndex: number) => void;
  /** fires when a diskette arc lands on its phone */
  onCollectorLand?: (spawn: CollectorSpawn) => void;
}

export interface HotlineScene {
  sync: (snapshot: HotlineSnapshot, deltaMS: number) => void;
  /** spin the reels and land them on `grid` */
  startSpin: (grid: string[][]) => void;
  isSpinning: () => boolean;
  /** true after the finite win cycle one pass, or when there are no wins */
  winsDone: () => boolean;
  /** start parallel diskette flights after the win gate */
  startCollectors: (spawns: readonly CollectorSpawn[]) => void;
  tickCollectors: (deltaMS: number) => void;
  collectorsDone: () => boolean;
  setPhoneMeters: (fills: readonly number[]) => void;
  setPhoneGlow: (color: TokenColor | null) => void;
  /** pass through to the win lines overlay cycle interval */
  setWinCycleMs: (ms: number) => void;
  /** faster reel stops on the next spin */
  setTurbo: (on: boolean) => void;
  /** swap crt reels for sticky hold board and phones for jackpot strip */
  setHoldMode: (on: boolean) => void;
  syncHold: (snapshot: HoldSnapshot) => void;
  setJackpotHighlight: (tier: JackpotTier | null) => void;
  tickHold: (deltaMS: number) => void;
  destroy: () => void;
}

const CELL_GAP = 4;

// frame-crt.png is 900x720, this is the clear glass rect measured from its alpha
const FRAME_W = 900;
const FRAME_H = 720;
const GLASS = { x: 100, y: 97, w: 698, h: 536 };
// the reels sit on a dark screen so symbols read against the sunset
const SCREEN_COLOR = 0x0a0614;
const SCREEN_ALPHA = 0.9;
const TITLE_COLOR = 0xff2e93;
// title sits this far below the canvas top edge
const TITLE_TOP_MIN_PX = 30;
const TITLE_TOP_MAX_PX = 50;

function snapshotKey(snap: HotlineSnapshot): string {
  const wins = snap.lineWins.map((w) => `${w.lineIndex}:${w.count}`).join(",");
  return `${snap.grid.map((reel) => reel.join(",")).join("|")}#${wins}`;
}

export function createHotlineScene(
  app: Application,
  config: HotlineConfig,
  textures: HotlineTextures,
  hooks: HotlineSceneHooks = {},
): HotlineScene {
  const { reels, rows, symbolWeights } = config.math;
  const symbolIds = Object.keys(symbolWeights[0]);
  // a config symbol with no art is a broken handoff, not something to paper over
  for (const id of symbolIds) {
    if (!textures.symbols[id]) {
      throw new Error(`hotline scene: no texture for symbol ${id}`);
    }
  }

  const root = new Container();
  const backdrop = new Sprite(textures.backdrop);
  backdrop.anchor.set(0.5);
  const title = new Text({
    text: "HOTLINE",
    style: {
      fontFamily: textures.fontFamily,
      fontSize: 32,
      fill: TITLE_COLOR,
      stroke: { color: 0x1a0b2e, width: 5 },
      letterSpacing: 4,
    },
  });
  title.anchor.set(0.5, 0);
  const phones = createPhonesLayer(
    textures,
    config.features.tokenOdds.meterTarget,
  );
  const jackpot = createJackpotStrip(textures.fontFamily);
  const screen = new Graphics();
  const frame = new Sprite(textures.frame);
  const reelWindow = createReelWindow({
    reels,
    rows,
    fillerIds: symbolIds,
    textureFor: (id) => textures.symbols[id],
    onReelStop: hooks.onReelStop,
  });
  // win lines and cell frames sit above the masked reels and the crt bezel
  const overlay = createWinLinesOverlay();
  const hold = createHoldLayer(textures.fontFamily);
  // flights sit above reels and overlay so neon arcs read over the crt
  const flight = createTokenFlight(textures);
  if (hooks.onCollectorLand) flight.onLand(hooks.onCollectorLand);
  root.addChild(
    backdrop,
    title,
    phones.container,
    jackpot.container,
    screen,
    reelWindow.container,
    frame,
    overlay.container,
    hold.container,
    flight.container,
  );
  app.stage.addChild(root);

  let destroyed = false;
  let holdMode = false;
  let lastKey = "";
  let lastW = 0;
  let lastH = 0;
  let lastSpinning = false;
  let gridLeft = 0;
  let gridTop = 0;
  let cellSize = 0;

  function layout(w: number, h: number): void {
    // backdrop is landscape art, cover the canvas and crop the sides
    const cover = Math.max(
      w / textures.backdrop.width,
      h / textures.backdrop.height,
    );
    backdrop.scale.set(cover);
    backdrop.position.set(w / 2, h / 2);

    // title is pinned near the top, phones and crt form one block below it
    const margin = Math.max(6, w * 0.02);
    const titleSize = Math.round(Math.min(Math.max(w * 0.07, 14), 40, h * 0.06));
    const titleTop = Math.min(
      TITLE_TOP_MAX_PX,
      Math.max(TITLE_TOP_MIN_PX, h * 0.05),
    );
    const titleBottom = titleTop + titleSize * 1.25;
    const phoneH = Math.max(24, Math.min(w * 0.2, h * 0.15, 120));
    const availW = Math.max(1, w - margin * 2);
    const availFrameH = Math.max(1, h - titleBottom - phoneH - margin * 2);
    const scale = Math.min(availW / FRAME_W, availFrameH / FRAME_H);
    const frameW = FRAME_W * scale;
    const frameH = FRAME_H * scale;
    const blockH = phoneH + frameH;
    // center the block in the space under the title, never above it
    const top = titleBottom + Math.max(0, (h - titleBottom - blockH) / 2);
    const frameLeft = (w - frameW) / 2;
    const frameTop = top + phoneH;

    title.style.fontSize = titleSize;
    title.position.set(w / 2, titleTop);
    phones.layout(frameLeft, top, frameW, phoneH);
    jackpot.layout(frameLeft, top, frameW, phoneH);
    frame.position.set(frameLeft, frameTop);
    frame.width = frameW;
    frame.height = frameH;

    // grid is centered in the glass, cells stay square
    const glassX = frameLeft + GLASS.x * scale;
    const glassY = frameTop + GLASS.y * scale;
    const glassW = GLASS.w * scale;
    const glassH = GLASS.h * scale;
    cellSize = Math.max(8, Math.min(glassW / reels, glassH / rows));
    gridLeft = glassX + (glassW - cellSize * reels) / 2;
    gridTop = glassY + (glassH - cellSize * rows) / 2;
    reelWindow.layout(gridLeft, gridTop, cellSize, CELL_GAP);

    // dark screen fills the glass and a little under the bezel
    const bleed = 8 * scale;
    screen
      .clear()
      .rect(glassX - bleed, glassY - bleed, glassW + bleed * 2, glassH + bleed * 2)
      .fill({ color: SCREEN_COLOR, alpha: SCREEN_ALPHA });
  }

  function geometry(): WinGeometry {
    const centers = Array.from({ length: reels }, (_, reel) =>
      Array.from({ length: rows }, (_, row) => ({
        x: gridLeft + reel * cellSize + cellSize / 2,
        y: gridTop + row * cellSize + cellSize / 2,
      })),
    );
    return {
      centers,
      cellSize,
      gap: CELL_GAP,
      callout: {
        x: gridLeft + (cellSize * reels) / 2,
        y: gridTop + cellSize * rows - Math.min(24, cellSize * 0.3),
      },
    };
  }

  // wins show only once every reel is at rest, one payline at a time
  function showWins(snap: HotlineSnapshot, spinning: boolean): void {
    if (holdMode) {
      overlay.clear();
      return;
    }
    if (spinning || snap.lineWins.length === 0) {
      overlay.clear();
      return;
    }
    overlay.showCycle(snap.lineWins, geometry());
  }

  function applyHoldMode(on: boolean): void {
    holdMode = on;
    reelWindow.container.visible = !on;
    overlay.container.visible = !on;
    hold.container.visible = on;
    phones.container.visible = !on;
    jackpot.container.visible = on;
    hold.setFlicker(on);
    if (!on) {
      jackpot.setActiveTier(null);
      hold.setFlicker(false);
    }
  }

  return {
    sync(snapshot: HotlineSnapshot, deltaMS: number): void {
      if (destroyed) return;
      const w = app.screen.width;
      const h = app.screen.height;
      const resized = w !== lastW || h !== lastH;
      if (resized) {
        lastW = w;
        lastH = h;
        layout(w, h);
      }

      if (holdMode) {
        hold.tick(deltaMS);
        return;
      }

      reelWindow.update(deltaMS);
      const spinning = reelWindow.isSpinning();
      const key = snapshotKey(snapshot);
      if (
        resized ||
        key !== lastKey ||
        spinning !== lastSpinning
      ) {
        lastKey = key;
        lastSpinning = spinning;
        if (!spinning) reelWindow.setGrid(snapshot.grid);
        showWins(snapshot, spinning);
      }
      if (!spinning) overlay.tick(deltaMS);
    },

    startSpin(grid: string[][]): void {
      if (destroyed) return;
      reelWindow.start(grid);
      overlay.clear();
      flight.start([], [], [], cellSize);
    },

    isSpinning(): boolean {
      return reelWindow.isSpinning();
    },

    winsDone(): boolean {
      return overlay.isDone();
    },

    startCollectors(spawns: readonly CollectorSpawn[]): void {
      if (destroyed) return;
      const geo = geometry();
      flight.start(spawns, geo.centers, phones.phoneCenters(), geo.cellSize);
    },

    tickCollectors(deltaMS: number): void {
      if (destroyed) return;
      flight.tick(deltaMS);
    },

    collectorsDone(): boolean {
      return flight.isDone();
    },

    setPhoneMeters(fills: readonly number[]): void {
      phones.setMeters(fills);
    },

    setPhoneGlow(color: TokenColor | null): void {
      phones.setGlow(color);
    },

    setWinCycleMs(ms: number): void {
      if (destroyed) return;
      overlay.setIntervalMs(ms);
    },

    setTurbo(on: boolean): void {
      if (destroyed) return;
      reelWindow.setTurbo(on);
    },

    setHoldMode(on: boolean): void {
      if (destroyed) return;
      applyHoldMode(!!on);
    },

    syncHold(snapshot: HoldSnapshot): void {
      if (destroyed) return;
      hold.sync(snapshot, geometry());
      jackpot.setActiveTier(snapshot.jackpotWon);
    },

    setJackpotHighlight(tier: JackpotTier | null): void {
      if (destroyed) return;
      jackpot.setActiveTier(tier);
    },

    tickHold(deltaMS: number): void {
      if (destroyed || !holdMode) return;
      hold.tick(deltaMS);
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      applyHoldMode(false);
      flight.destroy();
      hold.destroy();
      jackpot.destroy();
      overlay.destroy();
      reelWindow.destroy();
      phones.destroy();
      root.removeFromParent();
      root.destroy({ children: true });
    },
  };
}
