import {
  AnimatedSprite,
  Assets,
  Container,
  Graphics,
  Texture,
} from "pixi.js";
import { VIEW_CONFIG } from "./viewConfig.js";

export const ROCKET_ASSET_URLS = [
  "/assets/rocket/ship-1.png",
  "/assets/rocket/ship-2.png",
] as const;

export interface Rocket {
  container: Container;
  setBodyTextures: (textures: readonly Texture[]) => void;
  syncPose: (
    x: number,
    y: number,
    rotationRadians: number,
    showStreak: boolean,
  ) => void;
}
/** preloaded animation frames; falls back to geometric arrow if empty. */
export interface RocketOptions {
  bodyTextures?: readonly Texture[];
}

export function createRocket(options: RocketOptions = {}): Rocket {
  const container = new Container();

  const L = VIEW_CONFIG.ROCKET_LENGTH_PX;
  const halfW = L * 0.22;
  const bodyGraphics = new Graphics();
  bodyGraphics.poly([
    L * 0.5,
    0,
    -L * 0.35,
    -halfW,
    -L * 0.2,
    0,
    -L * 0.35,
    halfW,
  ]);
  bodyGraphics.fill({ color: 0xf3f0ff });
  container.addChild(bodyGraphics);

  // placeholder frame - replaced when textures load
  const bodySprite = new AnimatedSprite({
    textures: [Texture.EMPTY],
    animationSpeed: VIEW_CONFIG.ROCKET_ANIM_SPEED,
    loop: true,
    autoPlay: false,
    autoUpdate: true,
  });
  bodySprite.anchor.set(0.5, 0.55);
  bodySprite.rotation = VIEW_CONFIG.ROCKET_TEXTURE_ANGLE;
  bodySprite.visible = false;
  container.addChild(bodySprite);

  function fitFrames(textures: readonly Texture[]): void {
    const frames = textures.filter((t) => t && t !== Texture.EMPTY);
    if (frames.length === 0) return;

    bodySprite.textures = frames;
    const tw = Math.max(1, frames[0]!.width);
    const th = Math.max(1, frames[0]!.height);
    const scale = L / Math.max(tw, th);
    bodySprite.scale.set(scale);
    bodySprite.rotation = VIEW_CONFIG.ROCKET_TEXTURE_ANGLE;
    bodySprite.animationSpeed = VIEW_CONFIG.ROCKET_ANIM_SPEED;
    bodySprite.gotoAndPlay(0);
  }

  function setBodyTextures(textures: readonly Texture[]): void {
    const frames = textures.filter((t) => t && t !== Texture.EMPTY);
    if (frames.length > 0) {
      fitFrames(frames);
      bodySprite.visible = true;
      bodyGraphics.visible = false;
    } else {
      bodySprite.stop();
      bodySprite.visible = false;
      bodyGraphics.visible = true;
    }
  }

  function setBodyTexture(texture: Texture | null): void {
    setBodyTextures(texture ? [texture] : []);
  }

  if (options.bodyTextures && options.bodyTextures.length > 0) {
    setBodyTextures(options.bodyTextures);
  }

  function syncPose(
    x: number,
    y: number,
    _rotationRadians: number,
    showStreak: boolean,
  ): void {
    container.position.set(x, y);
    container.rotation = 0;
    if (!bodySprite.visible) return;
    if (showStreak) {
      if (!bodySprite.playing) bodySprite.play();
    } else {
      if (bodySprite.playing) bodySprite.stop();
    }
  }

  return { container, setBodyTextures, setBodyTexture, syncPose };
}

export async function loadRocketTextures(): Promise<Texture[]> {
  const loaded = await Assets.load([...ROCKET_ASSET_URLS]);
  return ROCKET_ASSET_URLS.map((url) => {
    const t = loaded[url];
    return t instanceof Texture ? t : Texture.EMPTY;
  });
}

