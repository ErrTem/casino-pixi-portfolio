import { Container, Graphics, Sprite } from "pixi.js";
import {
  TOKEN_COLOR_ORDER,
  type TokenColor,
} from "../logic/collectors/TokenColors.js";
import type { HotlineTextures } from "./loadHotlineAssets.js";

export interface PhonesLayer {
  container: Container;
  /** fits the cassette strip into a band and redraws bars */
  layout: (left: number, top: number, width: number, height: number) => void;
  /** scene-local land points at the three bottom slots, green red purple */
  phoneCenters: () => { x: number; y: number }[];
  /** soft-cap fills 0..meterTarget per phone in color order */
  setMeters: (fills: readonly number[]) => void;
  /** neon ring on one column, or clear */
  setGlow: (color: TokenColor | null) => void;
  destroy: () => void;
}

const BAR_NEON = 0x39ffe8;
/** source art is 900x381 */
const STRIP_ASPECT = 900 / 381;
/** column centers across the strip, left to right */
const SLOT_FRAC_X = [1.23 / 6, 1 / 2, 4.78 / 6] as const;
/** black slots sit near the base of each deck column */
const SLOT_FRAC_Y = 0.9;

// one strip sprite, meters and glow aimed at the three bottom slots
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
  const strip = new Sprite(textures.phonesStrip);
  strip.anchor.set(0.5);
  container.addChild(strip, glow, bars);

  let destroyed = false;
  let fills = [0, 0, 0];
  let glowColor: TokenColor | null = null;
  let stripBox = { left: 0, top: 0, width: 0, height: 0 };

  function slotCenters(): { x: number; y: number }[] {
    return SLOT_FRAC_X.map((fx) => ({
      x: stripBox.left + stripBox.width * fx,
      y: stripBox.top + stripBox.height * SLOT_FRAC_Y,
    }));
  }

  function drawBars(): void {
    bars.clear();
    if (stripBox.width <= 0 || stripBox.height <= 0) return;
    const centers = slotCenters();
    const colW = stripBox.width / centers.length;
    const segGap = 2;
    const segH = Math.max(3, Math.min(10, stripBox.height * 0.045));
    const segW = Math.max(
      3,
      (colW * 0.55 - segGap * (target - 1)) / target,
    );
    const barW = target * segW + (target - 1) * segGap;
    centers.forEach((c, i) => {
      const startX = c.x - barW / 2;
      // sit just above the black slot rect
      const y = c.y - segH * 1.6;
      const filled = Math.min(target, Math.max(0, Math.floor(fills[i] ?? 0)));
      for (let s = 0; s < target; s += 1) {
        const on = s < filled;
        bars
          .rect(startX + s * (segW + segGap), y, segW, segH)
          .fill({ color: BAR_NEON, alpha: on ? 1 : 0.2 });
      }
    });
  }

  // no outline around the active deck during feature play
  function drawGlow(): void {
    glow.clear();
    void glowColor;
  }

  return {
    container,

    layout(left: number, top: number, width: number, height: number): void {
      if (destroyed) return;
      // fit strip into the band preserving 900x381 aspect
      let fitW = width;
      let fitH = fitW / STRIP_ASPECT;
      if (fitH > height) {
        fitH = height;
        fitW = fitH * STRIP_ASPECT;
      }
      fitW = Math.max(8, fitW);
      fitH = Math.max(8, fitH);
      strip.width = fitW;
      strip.height = fitH;
      strip.position.set(left + width / 2, top + height / 2);
      stripBox = {
        left: strip.x - fitW / 2,
        top: strip.y - fitH / 2,
        width: fitW,
        height: fitH,
      };
      drawGlow();
      drawBars();
    },

    phoneCenters(): { x: number; y: number }[] {
      return slotCenters();
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
