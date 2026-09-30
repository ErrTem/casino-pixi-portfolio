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
 * Geometric rocket with texture-swap seam and capped spark/smoke tip trail.
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

  const trailCount = VIEW_CONFIG.TRAIL_COUNT;
  const spacing = VIEW_CONFIG.TRAIL_SPACING_PX;
  const trailDots: Graphics[] = [];
  for (let i = 0; i < trailCount; i++) {
    const dot = new Graphics();
    const isSmoke = i % 3 === 0;
    if (isSmoke) {
      const rx = 2.4 + (i % 4) * 0.35;
      const ry = 1.4 + (i % 3) * 0.25;
      dot.ellipse(0, 0, rx, ry).fill({ color: 0xb8b4d8 });
    } else {
      const r = 1.6 + (i % 3) * 0.35;
      dot.circle(0, 0, r).fill({ color: 0xfd953c });
    }
    dot.visible = false;
    trailDots.push(dot);
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
      for (let i = 0; i < trailCount; i++) {
        const dot = trailDots[i]!;
        // Local -X is -tangent after parent rotation (nose along +X).
        const offset = (i + 1) * spacing;
        const wobble = ((i % 5) - 2) * 0.35;
        dot.position.set(-offset, wobble);
        const t = i / trailCount;
        dot.alpha = (1 - t) * (1 - t) * 0.95;
        dot.scale.set(1 - t * 0.55);
        dot.visible = true;
      }
    } else {
      for (const dot of trailDots) {
        dot.visible = false;
      }
    }
  }

  return { container, setBodyTexture, syncPose };
}
