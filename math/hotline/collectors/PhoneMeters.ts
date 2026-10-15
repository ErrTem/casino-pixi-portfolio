import { TOKEN_COLOR_ORDER, type TokenColor } from "./TokenColors.js";

export interface PhoneMeters {
  increment(color: TokenColor): void;
  getCount(color: TokenColor): number;
  getDisplay(color: TokenColor): number;
  reset(color: TokenColor): void;
  snapshot(): Record<TokenColor, { count: number; display: number }>;
}

// soft cap display at meterTarget, raw counts may grow past it
export function createPhoneMeters(meterTarget: number): PhoneMeters {
  const counts: Record<TokenColor, number> = {
    green: 0,
    red: 0,
    purple: 0,
  };

  return {
    increment(color) {
      counts[color] += 1;
    },
    getCount(color) {
      return counts[color];
    },
    getDisplay(color) {
      return Math.min(counts[color], meterTarget);
    },
    reset(color) {
      counts[color] = 0;
    },
    snapshot() {
      const out = {} as Record<TokenColor, { count: number; display: number }>;
      for (const color of TOKEN_COLOR_ORDER) {
        out[color] = {
          count: counts[color],
          display: Math.min(counts[color], meterTarget),
        };
      }
      return out;
    },
  };
}
