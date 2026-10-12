import type { HotlineConfig } from "../config/HotlineConfigSchema.js";

export type PaytableRow = {
  label: string;
  detail: string;
};

export type PaytableSection = {
  id: "symbols" | "phones" | "gamble";
  title: string;
  rows: PaytableRow[];
};

// red stub, the real rows land in the green commit
export function paytableSheetModel(_config: HotlineConfig): PaytableSection[] {
  return [];
}
