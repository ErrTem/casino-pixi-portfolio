import type { CrashGame, CrashSnapshot } from "../logic/index.js";
import { PRESET_CHIPS } from "./chips.js";
import { enablementFrom } from "./enablement.js";
import { formatMoney, formatMult } from "./format.js";
import { renderHistoryStrip } from "./historyStrip.js";

export interface CrashHud {
  render(snap: CrashSnapshot): void;
}

/**
 * Thin HTML binder: commands in, snapshot fields out.
 * No wallet math — facade only. Enablement flags are UX; GameLogic remains authority.
 */
export function mountCrashHud(root: Element, game: CrashGame): CrashHud {
  const betInput = root.querySelector<HTMLInputElement>(
    "[data-field=bet-input]",
  );
  const autoInput = root.querySelector<HTMLInputElement>(
    "[data-field=auto-co]",
  );
  const placeBetBtn = root.querySelector<HTMLButtonElement>(
    "[data-action=place-bet]",
  );
  const cashOutBtn = root.querySelector<HTMLButtonElement>(
    "[data-action=cash-out]",
  );
  const clearAutoBtn = root.querySelector("[data-action=clear-auto-co]");
  const resetBtn = root.querySelector("[data-action=reset-wallet]");
  const statusEl = root.querySelector("[data-field=status]");
  const balanceEl = root.querySelector("[data-field=balance]");
  const phaseEl = root.querySelector("[data-field=phase]");
  const liveMultEl = root.querySelector("[data-field=live-mult]");
  const leftZone = root.querySelector("[data-zone=balance]");
  const chipsHost = root.querySelector("[data-field=chips]");
  const historyHost = root.querySelector("[data-field=history]");

  if (
    !betInput ||
    !autoInput ||
    !placeBetBtn ||
    !cashOutBtn ||
    !clearAutoBtn ||
    !resetBtn ||
    !statusEl ||
    !balanceEl ||
    !phaseEl ||
    !liveMultEl ||
    !leftZone ||
    !chipsHost ||
    !historyHost
  ) {
    throw new Error("CrashHud: required #hud-bar fields missing");
  }

  // Narrowed aliases so closures keep non-null types under strictNullChecks.
  const bet = betInput;
  const auto = autoInput;
  const placeBet = placeBetBtn;
  const cashOut = cashOutBtn;
  const clearAuto = clearAutoBtn;
  const reset = resetBtn;
  const status = statusEl;
  const balance = balanceEl;
  const phase = phaseEl;
  const liveMult = liveMultEl;
  const balanceZone = leftZone;
  const chips = chipsHost;
  const history = historyHost;

  let lastPlaceReason: string | null = null;

  // Chips: fill bet-input only — never call placeBet (Pitfall 4 / WALT-03).
  const chipButtons: HTMLButtonElement[] = [];
  for (const value of PRESET_CHIPS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = String(value);
    btn.dataset.chip = String(value);
    btn.className = "chip";
    btn.addEventListener("click", () => {
      bet.value = String(value);
      syncChipSelection();
    });
    chips.appendChild(btn);
    chipButtons.push(btn);
  }

  function syncChipSelection(): void {
    const current = bet.value;
    for (const btn of chipButtons) {
      btn.classList.toggle("chip--selected", btn.dataset.chip === current);
    }
  }

  placeBet.addEventListener("click", () => {
    const amount = Number(bet.value);
    const result = game.placeBet(amount);
    if (!result.ok) {
      lastPlaceReason = result.reason;
      status.textContent = result.reason;
    } else {
      lastPlaceReason = null;
      status.textContent = "";
    }
  });

  cashOut.addEventListener("click", () => {
    game.requestCashOut();
  });

  const applyAutoCo = () => {
    const raw = auto.value.trim();
    if (raw === "") game.setAutoCashOut(null);
    else game.setAutoCashOut(Number(raw));
  };

  auto.addEventListener("change", applyAutoCo);
  auto.addEventListener("blur", applyAutoCo);

  clearAuto.addEventListener("click", () => {
    auto.value = "";
    game.setAutoCashOut(null);
  });

  reset.addEventListener("click", () => {
    game.resetWallet();
    lastPlaceReason = null;
    status.textContent = "";
  });

  bet.addEventListener("input", syncChipSelection);
  syncChipSelection();

  function render(snap: CrashSnapshot): void {
    balance.textContent = formatMoney(snap.balance);
    phase.textContent = snap.phase;
    liveMult.textContent = formatMult(snap.multiplier);

    if (document.activeElement !== auto) {
      auto.value =
        snap.autoCashOutAt == null ? "" : String(snap.autoCashOutAt);
    }

    const en = enablementFrom(snap);
    placeBet.disabled = !en.canPlaceBet;
    cashOut.disabled = !en.canCashOut;
    bet.disabled = !en.canEditBet;
    auto.disabled = !en.canEditAuto;
    for (const btn of chipButtons) {
      btn.disabled = !en.chipsEnabled;
    }
    syncChipSelection();

    // History from snapshot only — never push from button handlers (WALT-05).
    renderHistoryStrip(history, snap.history);

    const emphasizeBroke = en.showBroke || lastPlaceReason === "broke";
    balanceZone.classList.toggle("hud-zone--broke", emphasizeBroke);
    reset.classList.toggle("reset-demo--emphasize", emphasizeBroke);
    if (emphasizeBroke && !status.textContent) {
      status.textContent = "broke — Reset demo to continue";
    }
  }

  return { render };
}
