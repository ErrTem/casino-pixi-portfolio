import { CRASH_CONFIG } from "./config.js";

/** Ring buffer of completed-round crashAt values (incl. spectator). */
export class History {
  private readonly items: number[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = CRASH_CONFIG.historySize) {
    this.maxSize = maxSize;
  }

  push(crashAt: number): void {
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
