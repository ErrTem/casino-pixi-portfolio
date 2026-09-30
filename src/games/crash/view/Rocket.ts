import { Container, Graphics, Sprite, type Texture } from "pixi.js";
import { VIEW_CONFIG } from "./viewConfig.js";

export interface Rocket {
  container: Container;
  setBodyTexture: (texture: Texture | null) => void;
  syncPose: (
    x: number,
    y: number,
    rotationRadians: number,
    showStreak: boolean,
  ) => void;
}

/**
 * Geometric rocket with texture-swap seam (no particle trail).
 * Position/rotation stay on the parent Container — path-follow never moves to the sprite.
 */
export function createRocket(): Rocket {
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

  const bodySprite = new Sprite();
  bodySprite.anchor.set(0.5);
  bodySprite.visible = false;
  container.addChild(bodySprite);

  function setBodyTexture(texture: Texture | null): void {
    if (texture) {
      bodySprite.texture = texture;
      bodySprite.visible = true;
      bodyGraphics.visible = false;
    } else {
      bodySprite.visible = false;
      bodyGraphics.visible = true;
    }
  }

  function syncPose(
    x: number,
    y: number,
    rotationRadians: number,
    _showStreak: boolean,
  ): void {
    container.position.set(x, y);
    container.rotation = rotationRadians;
  }

  return { container, setBodyTexture, syncPose };
}
