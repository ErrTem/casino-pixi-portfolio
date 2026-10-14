import { Container, Graphics, Sprite } from "pixi.js";
import type { CollectorSpawn } from "../logic/collectors/resolveCollectors.js";
import {
  TOKEN_COLOR_ORDER,
  type TokenColor,
} from "../logic/collectors/TokenColors.js";
import type { HotlineTextures } from "./loadHotlineAssets.js";
import { smoothstep } from "./reels/reelMotion.js";

export interface TokenFlight {
  container: Container;
  /** overlay diskettes on cells then fly parallel neon arcs to phones */
  start: (
    spawns: readonly CollectorSpawn[],
    cellCenters: { x: number; y: number }[][],
    phoneCenters: readonly { x: number; y: number }[],
    cellSize: number,
  ) => void;
  tick: (deltaMS: number) => void;
  isDone: () => boolean;
  /** fires once per spawn when its arc lands */
  onLand: (cb: ((spawn: CollectorSpawn) => void) | null) => void;
  destroy: () => void;
}

const ARC_MS = 620;
const NEON = 0x39ffe8;
const SCALE_OF_CELL = 0.7;

interface Flight {
  spawn: CollectorSpawn;
  sprite: Sprite;
  trail: Graphics;
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  elapsed: number;
  landed: boolean;
}

function pointOnQuad(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number,
): { x: number; y: number } {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

function textureFor(
  textures: HotlineTextures,
  color: TokenColor,
): Sprite["texture"] {
  return textures.diskettes[color];
}

function phoneIndex(color: TokenColor): number {
  const i = TOKEN_COLOR_ORDER.indexOf(color);
  return i < 0 ? 0 : i;
}

export function createTokenFlight(textures: HotlineTextures): TokenFlight {
  const container = new Container();
  let destroyed = false;
  let flights: Flight[] = [];
  let landCb: ((spawn: CollectorSpawn) => void) | null = null;
  let finished = true;

  function clearFlights(): void {
    for (const f of flights) {
      f.sprite.destroy();
      f.trail.destroy();
    }
    flights = [];
    container.removeChildren();
  }

  return {
    container,

    start(
      spawns: readonly CollectorSpawn[],
      cellCenters: { x: number; y: number }[][],
      phoneCenters: readonly { x: number; y: number }[],
      cellSize: number,
    ): void {
      if (destroyed) return;
      clearFlights();
      finished = spawns.length === 0;
      const size = Math.max(8, cellSize * SCALE_OF_CELL);
      for (const spawn of spawns) {
        const p0 = cellCenters[spawn.cell.reel]?.[spawn.cell.row];
        const p2 = phoneCenters[phoneIndex(spawn.color)];
        if (!p0 || !p2) continue;
        const midX = (p0.x + p2.x) / 2;
        const absY = Math.abs(p0.y - p2.y);
        // bottom strip lands need a short bow, not the old top-phone toss
        const midY =
          p2.y >= p0.y
            ? (p0.y + p2.y) / 2 - absY * 0.12 - 10
            : Math.min(p0.y, p2.y) - absY * 0.35 - 24;
        const p1 = { x: midX, y: midY };
        const sprite = new Sprite(textureFor(textures, spawn.color));
        sprite.anchor.set(0.5);
        sprite.width = size;
        sprite.height = size;
        sprite.position.set(p0.x, p0.y);
        const trail = new Graphics();
        container.addChild(trail, sprite);
        flights.push({
          spawn,
          sprite,
          trail,
          p0,
          p1,
          p2,
          elapsed: 0,
          landed: false,
        });
      }
      if (flights.length === 0) finished = true;
    },

    tick(deltaMS: number): void {
      if (destroyed || finished || !Number.isFinite(deltaMS) || deltaMS <= 0) {
        return;
      }
      let allDone = true;
      for (const f of flights) {
        if (f.landed) continue;
        allDone = false;
        f.elapsed += deltaMS;
        const t = smoothstep(0, 1, f.elapsed / ARC_MS);
        const pos = pointOnQuad(f.p0, f.p1, f.p2, t);
        f.sprite.position.set(pos.x, pos.y);
        // short neon trail behind the diskette
        f.trail.clear();
        const back = pointOnQuad(f.p0, f.p1, f.p2, Math.max(0, t - 0.12));
        f.trail.moveTo(back.x, back.y);
        f.trail.lineTo(pos.x, pos.y);
        f.trail.stroke({ width: 3, color: NEON, alpha: 0.55, cap: "round" });
        if (t >= 1) {
          f.landed = true;
          f.trail.clear();
          f.sprite.visible = false;
          landCb?.(f.spawn);
        }
      }
      if (allDone || flights.every((f) => f.landed)) {
        finished = true;
      }
    },

    isDone(): boolean {
      return finished;
    },

    onLand(cb: ((spawn: CollectorSpawn) => void) | null): void {
      landCb = cb;
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      clearFlights();
      container.removeFromParent();
      container.destroy({ children: true });
    },
  };
}
