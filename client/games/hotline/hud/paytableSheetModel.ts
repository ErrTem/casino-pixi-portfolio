import type { HotlineConfig } from "../../../../math/hotline/config/HotlineConfigSchema.js";

export type PaytableRow = {
  label: string;
  detail: string;
  /** config paytable key, only set on symbol rows so the view can pick art */
  symbolId?: string;
};

export type PaytableSection = {
  id: "symbols" | "phones" | "gamble";
  title: string;
  rows: PaytableRow[];
};

// pure rows for the info sheet, symbol numbers come straight from config.paytable
export function paytableSheetModel(config: HotlineConfig): PaytableSection[] {
  const wildId = config.math.wildSymbolId;
  const symbolRows: PaytableRow[] = [
    {
      label: wildId.toUpperCase(),
      symbolId: wildId,
      detail: "wild, substitutes for other symbols on paylines",
    },
    ...Object.entries(config.paytable).map(([id, pay]) => ({
      label: id.toUpperCase(),
      symbolId: id,
      detail: `3 x${pay["3"]}  4 x${pay["4"]}  5 x${pay["5"]}`,
    })),
  ];
  const { meterTarget } = config.features.tokenOdds;
  const { picks } = config.features.pickEm;
  const phoneRows: PaytableRow[] = [
    {
      label: "DISKETTES",
      detail: `colored diskettes can land on any spin and fly to the cassette strip slots, fill a meter to ${meterTarget} to start a feature`,
    },
    {
      label: "GREEN FREE SPINS",
      detail: "green deck, a run of spins on the house",
    },
    {
      label: "RED HOLD AND WIN",
      detail: "red deck, hold and respin cash with jackpots",
    },
    {
      label: "PURPLE LOCKERS",
      detail: `purple deck, open ${picks} lockers for prizes`,
    },
    {
      label: "COMBOS",
      detail: "more than one deck firing plays as a night, green then red then purple",
    },
  ];

  const { maxRounds } = config.features.gamble;
  const gambleRows: PaytableRow[] = [
    {
      label: "VHS GAMBLE",
      detail: "after a base line win you can double it, press SURVIVE or DIE",
    },
    {
      label: "ROUNDS",
      detail: `up to ${maxRounds} rounds in a row, line wins only`,
    },
    {
      label: "BANK",
      detail: "press SPIN to keep what you have, a lost round takes the pot",
    },
  ];

  return [
    {
      id: "symbols",
      title: `SYMBOLS  ${wildId.toUpperCase()} IS WILD`,
      rows: symbolRows,
    },
    {
      id: "phones",
      title: "CASSETTE STRIP AND BONUSES",
      rows: phoneRows,
    },
    { id: "gamble", title: "VHS GAMBLE", rows: gambleRows },
  ];
}
