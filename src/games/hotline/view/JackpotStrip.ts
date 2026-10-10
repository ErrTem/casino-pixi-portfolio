import { Container, Graphics, Text } from "pixi.js";
import type { JackpotTier } from "../logic/features/holdAndWin.js";

export interface JackpotStrip {
  container: Container;
  layout: (left: number, top: number, width: number, height: number) => void;
  setActiveTier: (tier: JackpotTier | null) => void;
  destroy: () => void;
}

const LABELS = ["MIN", "MID", "MAX", "ULTRA"] as const;
const TIER_BY_LABEL: Record<(typeof LABELS)[number], JackpotTier> = {
  MIN: "mini",
  MID: "minor",
  MAX: "major",
  ULTRA: "grand",
};

const IDLE = 0x8a7a9a;
const HOT = 0xffd24a;
const NEON = 0xff2e93;

// four jackpot labels in the phones band during hold
export function createJackpotStrip(fontFamily: string): JackpotStrip {
  const container = new Container();
  const underline = new Graphics();
  container.addChild(underline);
  container.visible = false;

  const texts = LABELS.map((label) => {
    const text = new Text({
      text: label,
      style: {
        fontFamily,
        fontSize: 16,
        fontWeight: "bold",
        fill: IDLE,
        letterSpacing: 2,
      },
    });
    text.anchor.set(0.5);
    container.addChild(text);
    return text;
  });

  let destroyed = false;
  let active: JackpotTier | null = null;
  let band = { left: 0, top: 0, width: 0, height: 0 };

  function paint(): void {
    underline.clear();
    if (band.width <= 0 || band.height <= 0) return;
    const slotW = band.width / texts.length;
    const size = Math.max(10, Math.min(band.height * 0.55, slotW * 0.4));
    texts.forEach((text, i) => {
      const label = LABELS[i];
      const tier = TIER_BY_LABEL[label];
      const hot = active === tier;
      text.style.fontSize = size;
      text.style.fill = hot ? HOT : IDLE;
      text.position.set(
        band.left + slotW * (i + 0.5),
        band.top + band.height * 0.45,
      );
      if (hot) {
        underline
          .rect(
            text.x - text.width / 2 - 4,
            text.y + text.height / 2 + 2,
            text.width + 8,
            3,
          )
          .fill({ color: NEON, alpha: 0.9 });
      }
    });
  }

  return {
    container,

    layout(left: number, top: number, width: number, height: number): void {
      if (destroyed) return;
      band = { left, top, width, height };
      paint();
    },

    setActiveTier(tier: JackpotTier | null): void {
      if (destroyed) return;
      active = tier;
      paint();
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      container.removeFromParent();
      container.destroy({ children: true });
    },
  };
}
