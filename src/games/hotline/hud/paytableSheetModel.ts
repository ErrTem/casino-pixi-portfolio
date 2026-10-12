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

// pure rows for the info sheet, symbol numbers come straight from config.paytable
export function paytableSheetModel(config: HotlineConfig): PaytableSection[] {
  const symbolRows: PaytableRow[] = Object.entries(config.paytable).map(
    ([id, pay]) => ({
      label: id.toUpperCase(),
      detail: `3 x${pay["3"]}  4 x${pay["4"]}  5 x${pay["5"]}`,
    }),
  );
  const { meterTarget } = config.features.tokenOdds;
  const { picks } = config.features.pickEm;
  const phoneRows: PaytableRow[] = [
    {
      label: "DISKETTES",
      detail: `colored diskettes can land on any spin and fly to the phones, ${meterTarget} fill a phone`,
    },
    {
      label: "GREEN PHONE",
      detail: "Free Spins, a run of spins on the house",
    },
    {
      label: "RED PHONE",
      detail: "Hold Night, hold and respin cash with jackpots",
    },
    {
      label: "PURPLE PHONE",
      detail: `Locker Pick, open ${picks} lockers for prizes`,
    },
    {
      label: "COMBOS",
      detail: "more than one phone ringing plays as a night, green then red then purple",
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
      title: `SYMBOLS  ${config.math.wildSymbolId.toUpperCase()} IS WILD`,
      rows: symbolRows,
    },
    { id: "phones", title: "PHONES AND BONUSES", rows: phoneRows },
    { id: "gamble", title: "VHS GAMBLE", rows: gambleRows },
  ];
}
