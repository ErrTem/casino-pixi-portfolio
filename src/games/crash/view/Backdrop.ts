import { Container, FillGradient, Graphics } from "pixi.js";

export interface Backdrop {
  container: Container;
  /** Rebuild layers only when screen size changes — never clear every sync frame. */
  rebuildIfNeeded: (width: number, height: number) => void;
  /** Advance cloud/star drift (call each sync with deltaMS). */
  tick: (deltaMS: number) => void;
}

/**
 * Cosmos (top) → horizon/clouds (bottom). No plot grid.
 * Stars and clouds drift continuously.
 */
export function createBackdrop(width: number, height: number): Backdrop {
  const container = new Container();
  let lastW = -1;
  let lastH = -1;
  let scrollMs = 0;
  let stars: Graphics | null = null;
  let clouds: Graphics | null = null;
  let screenW = width;

  function rebuild(w: number, h: number): void {
    container.removeChildren();
    screenW = w;

    const sky = new Graphics();
    const gradient = new FillGradient({
      type: "linear",
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: "#070b18" },
        { offset: 0.45, color: "#1a2840" },
        { offset: 0.78, color: "#5a8fb8" },
        { offset: 1, color: "#9ec8e8" },
      ],
    });
    sky.rect(0, 0, w, h).fill(gradient);
    container.addChild(sky);

    // Draw stars across a 2× wide strip so horizontal wrap scroll has no gap.
    stars = new Graphics();
    for (let i = 0; i < 56; i++) {
      const u = ((i * 47) % 97) / 97;
      const v = ((i * 31 + 13) % 89) / 89;
      const x = u * w * 2;
      const y = h * (0.02 + v * 0.42);
      const r = 0.7 + (i % 3) * 0.4;
      stars.circle(x, y, r).fill({
        color: 0xffffff,
        alpha: 0.22 + (i % 5) * 0.05,
      });
    }
    container.addChild(stars);

    // Clouds across a 2× wide strip for seamless wrap.
    clouds = new Graphics();
    const cloudSpecs = [
      { cx: w * 0.18, cy: h * 0.78, rx: w * 0.12, ry: h * 0.035 },
      { cx: w * 0.48, cy: h * 0.82, rx: w * 0.16, ry: h * 0.04 },
      { cx: w * 0.78, cy: h * 0.76, rx: w * 0.11, ry: h * 0.03 },
      { cx: w * 0.35, cy: h * 0.88, rx: w * 0.09, ry: h * 0.025 },
      { cx: w * 0.62, cy: h * 0.86, rx: w * 0.13, ry: h * 0.032 },
      { cx: w * 1.18, cy: h * 0.8, rx: w * 0.12, ry: h * 0.035 },
      { cx: w * 1.48, cy: h * 0.84, rx: w * 0.14, ry: h * 0.038 },
      { cx: w * 1.78, cy: h * 0.77, rx: w * 0.1, ry: h * 0.028 },
    ];
    for (const c of cloudSpecs) {
      clouds.ellipse(c.cx, c.cy, c.rx, c.ry).fill({
        color: 0xffffff,
        alpha: 0.16,
      });
    }
    container.addChild(clouds);

    lastW = w;
    lastH = h;
  }

  rebuild(width, height);

  return {
    container,
    rebuildIfNeeded(nextW: number, nextH: number): void {
      if (nextW !== lastW || nextH !== lastH) {
        rebuild(nextW, nextH);
      }
    },
    tick(deltaMS: number): void {
      const dt = Number.isFinite(deltaMS) ? Math.max(0, deltaMS) : 0;
      scrollMs += dt;
      const w = screenW > 0 ? screenW : 1;

      if (stars) {
        // Slow starfield drift left; wrap every screen width.
        const starPeriod = 48_000;
        const starU = (scrollMs % starPeriod) / starPeriod;
        stars.position.x = -starU * w;
        stars.position.y = Math.sin((scrollMs * 2 * Math.PI) / 22_000) * 4;
      }

      if (clouds) {
        // Faster cloud drift + gentle bob.
        const cloudPeriod = 28_000;
        const cloudU = (scrollMs % cloudPeriod) / cloudPeriod;
        clouds.position.x = -cloudU * w;
        clouds.position.y = Math.sin((scrollMs * 2 * Math.PI) / 9_000) * 5;
      }
    },
  };
}
