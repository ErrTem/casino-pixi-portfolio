import type { TokenColor } from "./TokenColors.js";

export interface PhoneMeters {
  increment(color: TokenColor): void;
  getCount(color: TokenColor): number;
  getDisplay(color: TokenColor): number;
  reset(color: TokenColor): void;
  snapshot(): Record<TokenColor, { count: number; display: number }>;
}

export function createPhoneMeters(_meterTarget: number): PhoneMeters {
  // stub for red phase
  return {
    increment() {},
    getCount() {
      return 0;
    },
    getDisplay() {
      return 0;
    },
    reset() {},
    snapshot() {
      return {
        green: { count: 0, display: 0 },
        red: { count: 0, display: 0 },
        purple: { count: 0, display: 0 },
      };
    },
  };
}
