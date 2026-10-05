import { AnimatedSprite, Assets, Container, Texture } from "pixi.js";
import { VIEW_CONFIG } from "./viewConfig.js";

export const EXPLOSION_ASSET_URLS = [
  "/assets/explosion/circle-1.png",
  "/assets/explosion/circle-2.png",
  "/assets/explosion/circle-3.png",
  "/assets/explosion/circle-4.png",
  "/assets/explosion/circle-5.png",
  "/assets/explosion/circle-6.png",
  "/assets/explosion/circle-7.png",
  "/assets/explosion/circle-8.png",
  "/assets/explosion/circle-9.png",
  "/assets/explosion/circle-10.png",
] as const;

export interface Explosion {
  container: Container;
  setFrames: (textures: readonly Texture[]) => void;
  playAt: (x: number, y: number) => void;
  hide: () => void;
}

export interface ExplosionOptions {
  frames?: readonly Texture[];
}

export function createExplosion(options: ExplosionOptions = {}): Explosion {
  const container = new Container();
  container.visible = false;

  const sprite = new AnimatedSprite({
    textures: [Texture.EMPTY],
    animationSpeed: VIEW_CONFIG.EXPLOSION_ANIM_SPEED,
    loop: false,
    autoPlay: false,
    autoUpdate: true,
  });
  sprite.anchor.set(0.5);
  sprite.visible = false;
  container.addChild(sprite);

  sprite.onComplete = () => {
    sprite.visible = false;
    container.visible = false;
  };

  function fit(textures: readonly Texture[]): void {
    const frames = textures.filter((t) => t && t !== Texture.EMPTY);
    if (frames.length === 0) return;
    sprite.textures = frames;
    const tw = Math.max(1, frames[0]!.width);
    const th = Math.max(1, frames[0]!.height);
    const scale = VIEW_CONFIG.EXPLOSION_SIZE_PX / Math.max(tw, th);
    sprite.scale.set(scale);
    sprite.animationSpeed = VIEW_CONFIG.EXPLOSION_ANIM_SPEED;
  }

  function setFrames(textures: readonly Texture[]): void {
    fit(textures);
  }

  if (options.frames && options.frames.length > 0) {
    setFrames(options.frames);
  }

  function playAt(x: number, y: number): void {
    if (sprite.totalFrames < 2 && sprite.texture === Texture.EMPTY) {
      return;
    }
    container.position.set(x, y);
    container.visible = true;
    sprite.visible = true;
    sprite.gotoAndPlay(0);
  }

  function hide(): void {
    sprite.stop();
    sprite.visible = false;
    container.visible = false;
  }

  return { container, setFrames, playAt, hide };
}

export async function loadExplosionTextures(): Promise<Texture[]> {
  const loaded = await Assets.load([...EXPLOSION_ASSET_URLS]);
  return EXPLOSION_ASSET_URLS.map((url) => {
    const t = loaded[url];
    return t instanceof Texture ? t : Texture.EMPTY;
  });
}
