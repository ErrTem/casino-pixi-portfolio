import { CRASH_CONFIG } from "./config.js";

/** buffer of crashAt values */
export class History {
  private readonly items: number[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = CRASH_CONFIG.historySize) {
    this.maxSize = maxSize;
  }

  push(crashAt: number): void {
    if (!Number.isFinite(crashAt)) return;
    this.items.push(crashAt);
    if (this.items.length > this.maxSize) {
      this.items.shift();
    }
  }

  toArray(): readonly number[] {
    return this.items.slice();
  }

  get length(): number {
    return this.items.length;
  }
}
