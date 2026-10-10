import { Container, Sprite } from "pixi.js";
import type { HotlineTextures } from "./loadHotlineAssets.js";

export interface PhonesLayer {
  container: Container;
  /** spreads the three phones across a band, no meter or fill state yet */
  layout: (left: number, top: number, width: number, height: number) => void;
  destroy: () => void;
}

// inert silhouettes, left to right: free spins, hold and win, pick em
export function createPhonesLayer(textures: HotlineTextures): PhonesLayer {
  const container = new Container();
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

  return {
    container,

    layout(left: number, top: number, width: number, height: number): void {
      if (destroyed) return;
      const slotW = width / sprites.length;
      const size = Math.max(8, Math.min(height, slotW * 0.92));
      sprites.forEach((sprite, i) => {
        sprite.width = size;
        sprite.height = size;
        sprite.position.set(left + slotW * (i + 0.5), top + height / 2);
      });
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      container.removeFromParent();
      container.destroy({ children: true });
    },
  };
}
