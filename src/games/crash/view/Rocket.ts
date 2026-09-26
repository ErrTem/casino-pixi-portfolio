import { Container, Graphics, Sprite, type Texture } from "pixi.js";
import { VIEW_CONFIG } from "./viewConfig.js";

const STREAK_COUNT = 8;
const STREAK_SPACING_PX = 5;
const STREAK_RADIUS = 2.2;

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
 * Geometric rocket with texture-swap seam and short tail streak (D-05..D-08).
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
  bodyGraphics.fill({ color: 0xe8eef4 });
  container.addChild(bodyGraphics);

  const bodySprite = new Sprite();
  bodySprite.anchor.set(0.5);
  bodySprite.visible = false;
  container.addChild(bodySprite);

  const streakDots: Graphics[] = [];
  for (let i = 0; i < STREAK_COUNT; i++) {
    const dot = new Graphics();
    dot.circle(0, 0, STREAK_RADIUS).fill({ color: 0xffffff });
    dot.visible = false;
    streakDots.push(dot);
    container.addChild(dot);
  }

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
    showStreak: boolean,
  ): void {
    container.position.set(x, y);
    container.rotation = rotationRadians;

    if (showStreak) {
      for (let i = 0; i < STREAK_COUNT; i++) {
        const dot = streakDots[i]!;
        // Local -X is -tangent after parent rotation (nose along +X).
        const offset = (i + 1) * STREAK_SPACING_PX;
        dot.position.set(-offset, 0);
        dot.alpha = 1 - i / STREAK_COUNT;
        dot.visible = true;
      }
    } else {
      for (const dot of streakDots) {
        dot.visible = false;
      }
    }
  }

  return { container, setBodyTexture, syncPose };
}
