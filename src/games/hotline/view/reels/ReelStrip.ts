import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { LAND_MS, SPIN_CELLS_PER_MS, landOffset } from "./reelMotion.js";

export interface ReelStripOptions {
  rows: number;
  /** symbol ids used as filler while the strip is spinning */
  fillerIds: string[];
  /** texture for a symbol id, undefined when the id has no art */
  textureFor: (symbolId: string) => Texture | undefined;
  /** shifts the filler sequence so neighbour reels do not blur identically */
  fillerShift?: number;
  onStop?: () => void;
}

export interface ReelStrip {
  /** holds the masked strip, position it at the reel column */
  container: Container;
  /** cell size in px and gap between cells */
  setSize: (pitch: number, gap: number) => void;
  /** show a settled column, ignored while the reel moves */
  setSymbols: (symbols: string[]) => void;
  /** begin spinning, land on `target` after `stopAfterMs` */
  start: (target: string[], stopAfterMs: number) => void;
  update: (deltaMS: number) => void;
  isBusy: () => boolean;
  destroy: () => void;
}

type Mode = "idle" | "spinning" | "landing";

interface Cell {
  holder: Sprite;
  symbol: string;
  drawnSize: number;
}

export function createReelStrip(options: ReelStripOptions): ReelStrip {
  const { rows, fillerIds, textureFor } = options;
  // landing layout: rows target cells, then rows + 1 cells carried over from the spin
  const cellCount = rows * 2 + 1;

  const container = new Container();
  const strip = new Container();
  const mask = new Graphics();
  container.addChild(strip, mask);
  container.mask = mask;

  const cells: Cell[] = [];
  for (let i = 0; i < cellCount; i += 1) {
    const holder = new Sprite(Texture.EMPTY);
    holder.anchor.set(0.5);
    holder.visible = false;
    strip.addChild(holder);
    cells.push({ holder, symbol: "", drawnSize: 0 });
  }

  let pitch = 0;
  let gap = 4;
  let mode: Mode = "idle";
  let destroyed = false;

  // spin state, offsets are in cells
  let scroll = 0;
  let wraps = 0;
  let elapsed = 0;
  let stopAfter = 0;
  let target: string[] = [];
  // landing state
  let landStart = 0;
  let landElapsed = 0;
  let visibleNow: string[] = [];

  function filler(n: number): string {
    const len = fillerIds.length;
    if (len === 0) return "";
    const at = n + (options.fillerShift ?? 0);
    return fillerIds[((at % len) + len) % len];
  }

  function paintCell(index: number, symbol: string): void {
    const cell = cells[index];
    const size = Math.max(1, pitch - gap);
    if (cell.symbol === symbol && cell.drawnSize === size) return;
    cell.symbol = symbol;
    cell.drawnSize = size;
    if (symbol === "") {
      cell.holder.texture = Texture.EMPTY;
      return;
    }
    const texture = textureFor(symbol);
    if (!texture) throw new Error(`hotline reels: no texture for symbol ${symbol}`);
    cell.holder.texture = texture;
    cell.holder.width = size;
    cell.holder.height = size;
  }

  // sprite is centered in its cell, row is the cell slot in the strip
  function setRow(index: number, row: number): void {
    const holder = cells[index].holder;
    holder.x = pitch / 2;
    holder.y = row * pitch + pitch / 2;
  }

  function place(index: number, symbol: string, row: number): void {
    const cell = cells[index];
    cell.holder.visible = true;
    paintCell(index, symbol);
    setRow(index, row);
  }

  function hideFrom(index: number): void {
    for (let i = index; i < cellCount; i += 1) cells[i].holder.visible = false;
  }

  function redrawMask(): void {
    mask.clear();
    mask.rect(0, 0, pitch, pitch * rows).fill(0xffffff);
  }

  // settled column, strip sits at rest
  function showColumn(symbols: string[]): void {
    for (let r = 0; r < rows; r += 1) place(r, symbols[r] ?? "", r);
    hideFrom(rows);
    strip.y = 0;
  }

  // spinning window is rows + 1 cells, cell 0 is the one half above the mask
  function symbolsWhileSpinning(): string[] {
    const out: string[] = [];
    for (let k = 0; k <= rows; k += 1) out.push(filler(wraps - k));
    return out;
  }

  function renderSpin(): void {
    visibleNow = symbolsWhileSpinning();
    for (let k = 0; k <= rows; k += 1) place(k, visibleNow[k], k);
    hideFrom(rows + 1);
    strip.y = (scroll - 1) * pitch;
  }

  function beginLanding(): void {
    // targets on top, the spin window below, strip slides down onto the targets
    for (let r = 0; r < rows; r += 1) place(r, target[r] ?? "", r);
    for (let k = 0; k <= rows; k += 1) place(rows + k, visibleNow[k], rows + k);
    hideFrom(rows * 2 + 1);
    landStart = scroll - (rows + 1);
    landElapsed = 0;
    mode = "landing";
    strip.y = landStart * pitch;
  }

  function finish(): void {
    mode = "idle";
    showColumn(target);
    options.onStop?.();
  }

  return {
    container,

    setSize(nextPitch: number, nextGap: number): void {
      if (destroyed) return;
      pitch = Math.max(1, nextPitch);
      gap = nextGap;
      redrawMask();
      if (mode === "idle") {
        const shown = cells.slice(0, rows).map((c) => c.symbol);
        for (let i = 0; i < cellCount; i += 1) cells[i].drawnSize = 0;
        showColumn(shown);
      } else if (mode === "spinning") {
        for (let i = 0; i < cellCount; i += 1) cells[i].drawnSize = 0;
        renderSpin();
      } else {
        for (let i = 0; i < cellCount; i += 1) {
          cells[i].drawnSize = 0;
          paintCell(i, cells[i].symbol);
          setRow(i, i);
        }
        strip.y = landOffset(landStart, SPIN_CELLS_PER_MS * LAND_MS, landElapsed / LAND_MS) * pitch;
      }
    },

    setSymbols(symbols: string[]): void {
      if (destroyed || mode !== "idle") return;
      showColumn(symbols);
    },

    start(nextTarget: string[], stopAfterMs: number): void {
      if (destroyed || mode !== "idle") return;
      target = nextTarget.slice(0, rows);
      stopAfter = stopAfterMs;
      elapsed = 0;
      scroll = 0;
      wraps = 0;
      mode = "spinning";
      renderSpin();
    },

    update(deltaMS: number): void {
      if (destroyed || mode === "idle") return;
      const dt = Number.isFinite(deltaMS) ? Math.max(0, Math.min(deltaMS, 100)) : 0;
      if (mode === "spinning") {
        elapsed += dt;
        scroll += SPIN_CELLS_PER_MS * dt;
        while (scroll >= 1) {
          scroll -= 1;
          wraps += 1;
        }
        renderSpin();
        if (elapsed >= stopAfter) beginLanding();
        return;
      }
      landElapsed += dt;
      if (landElapsed >= LAND_MS) {
        finish();
        return;
      }
      strip.y = landOffset(landStart, SPIN_CELLS_PER_MS * LAND_MS, landElapsed / LAND_MS) * pitch;
    },

    isBusy(): boolean {
      return mode !== "idle";
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      mode = "idle";
      container.removeFromParent();
      container.destroy({ children: true });
    },
  };
}
