import { Container, Graphics, Sprite } from "pixi.js";
import {
  TOKEN_COLOR_ORDER,
  type TokenColor,
} from "../logic/collectors/TokenColors.js";
import type { HotlineTextures } from "./loadHotlineAssets.js";

export interface PhonesLayer {
  container: Container;
  /** spreads the three phones across a band and redraws bars */
  layout: (left: number, top: number, width: number, height: number) => void;
  /** scene-local centers under each phone sprite, green red purple */
  phoneCenters: () => { x: number; y: number }[];
  /** soft-cap fills 0..meterTarget per phone in color order */
  setMeters: (fills: readonly number[]) => void;
  /** neon ring on one phone, or clear */
  setGlow: (color: TokenColor | null) => void;
  destroy: () => void;
}

const BAR_NEON = 0x39ffe8;
const GLOW_NEON = 0xff2e93;

// left to right free spins, hold and win, pick em with procedural bars
export function createPhonesLayer(
  textures: HotlineTextures,
  meterTarget: number,
): PhonesLayer {
  const target = Number.isFinite(meterTarget)
    ? Math.max(1, Math.floor(meterTarget))
    : 6;
  const container = new Container();
  const glow = new Graphics();
  const bars = new Graphics();
  container.addChild(glow, bars);

  const sprites = [
    textures.phones.green,
    textures.phones.red,
    textures.phones.purple,
  ].map((texture) => {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    container.addChild(sprite);
    return sprite;
  });

  let destroyed = false;
  let fills = [0, 0, 0];
  let glowColor: TokenColor | null = null;
  let band = { left: 0, top: 0, width: 0, height: 0 };

  function drawBars(): void {
    bars.clear();
    if (band.width <= 0 || band.height <= 0) return;
    const slotW = band.width / sprites.length;
    const size = Math.max(8, Math.min(band.height, slotW * 0.92));
    const segGap = 2;
    const segH = Math.max(3, size * 0.08);
    const segW = Math.max(
      3,
      (size * 0.7 - segGap * (target - 1)) / target,
    );
    const barW = target * segW + (target - 1) * segGap;
    sprites.forEach((sprite, i) => {
      const cx = sprite.x;
      const y = sprite.y + size * 0.42;
      const startX = cx - barW / 2;
      const filled = Math.min(target, Math.max(0, Math.floor(fills[i] ?? 0)));
      for (let s = 0; s < target; s += 1) {
        const on = s < filled;
        bars
          .rect(startX + s * (segW + segGap), y, segW, segH)
          .fill({ color: BAR_NEON, alpha: on ? 1 : 0.2 });
      }
    });
  }

  function drawGlow(): void {
    glow.clear();
    if (!glowColor) return;
    const idx = TOKEN_COLOR_ORDER.indexOf(glowColor);
    if (idx < 0) return;
    const sprite = sprites[idx];
    const r = Math.max(12, sprite.width * 0.55);
    glow
      .circle(sprite.x, sprite.y, r)
      .stroke({ width: 4, color: GLOW_NEON, alpha: 0.85 });
    glow
      .circle(sprite.x, sprite.y, r + 6)
      .stroke({ width: 8, color: GLOW_NEON, alpha: 0.25 });
  }

  return {
    container,

    layout(left: number, top: number, width: number, height: number): void {
      if (destroyed) return;
      band = { left, top, width, height };
      const slotW = width / sprites.length;
      const size = Math.max(8, Math.min(height, slotW * 0.92));
      sprites.forEach((sprite, i) => {
        sprite.width = size;
        sprite.height = size;
        sprite.position.set(left + slotW * (i + 0.5), top + height / 2);
      });
      drawGlow();
      drawBars();
    },

    phoneCenters(): { x: number; y: number }[] {
      return sprites.map((sprite) => ({ x: sprite.x, y: sprite.y }));
    },

    setMeters(next: readonly number[]): void {
      if (destroyed) return;
      fills = TOKEN_COLOR_ORDER.map((_, i) => {
        const v = next[i];
        return Number.isFinite(v) ? Math.max(0, Math.floor(v as number)) : 0;
      });
      drawBars();
    },

    setGlow(color: TokenColor | null): void {
      if (destroyed) return;
      glowColor = color;
      drawGlow();
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      container.removeFromParent();
      container.destroy({ children: true });
    },
  };
}
