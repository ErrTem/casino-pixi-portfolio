import type { CrashGame, CrashSnapshot } from "../logic/index.js";
import { PRESET_CHIPS } from "./chips.js";
import { enablementFrom } from "./enablement.js";
import { formatMoney, formatMult } from "./format.js";

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
    !chipsHost
  ) {
    throw new Error("CrashHud: required #hud-bar fields missing");
  }

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
      betInput.value = String(value);
      syncChipSelection();
    });
    chipsHost.appendChild(btn);
    chipButtons.push(btn);
  }

  function syncChipSelection(): void {
    const current = betInput.value;
    for (const btn of chipButtons) {
      btn.classList.toggle("chip--selected", btn.dataset.chip === current);
    }
  }

  placeBetBtn.addEventListener("click", () => {
    const amount = Number(betInput.value);
    const result = game.placeBet(amount);
    if (!result.ok) {
      lastPlaceReason = result.reason;
      statusEl.textContent = result.reason;
    } else {
      lastPlaceReason = null;
      statusEl.textContent = "";
    }
  });

  cashOutBtn.addEventListener("click", () => {
    game.requestCashOut();
  });

  const applyAutoCo = () => {
    const raw = autoInput.value.trim();
    if (raw === "") game.setAutoCashOut(null);
    else game.setAutoCashOut(Number(raw));
  };

  autoInput.addEventListener("change", applyAutoCo);
  autoInput.addEventListener("blur", applyAutoCo);

  clearAutoBtn.addEventListener("click", () => {
    autoInput.value = "";
    game.setAutoCashOut(null);
  });

  resetBtn.addEventListener("click", () => {
    game.resetWallet();
    lastPlaceReason = null;
    statusEl.textContent = "";
  });

  betInput.addEventListener("input", syncChipSelection);
  syncChipSelection();

  function render(snap: CrashSnapshot): void {
    balanceEl!.textContent = formatMoney(snap.balance);
    phaseEl!.textContent = snap.phase;
    liveMultEl!.textContent = formatMult(snap.multiplier);

    if (document.activeElement !== autoInput) {
      autoInput!.value =
        snap.autoCashOutAt == null ? "" : String(snap.autoCashOutAt);
    }

    const en = enablementFrom(snap);
    placeBetBtn!.disabled = !en.canPlaceBet;
    cashOutBtn!.disabled = !en.canCashOut;
    betInput!.disabled = !en.canEditBet;
    autoInput!.disabled = !en.canEditAuto;
    for (const btn of chipButtons) {
      btn.disabled = !en.chipsEnabled;
    }
    syncChipSelection();

    const emphasizeBroke = en.showBroke || lastPlaceReason === "broke";
    leftZone!.classList.toggle("hud-zone--broke", emphasizeBroke);
    resetBtn!.classList.toggle("reset-demo--emphasize", emphasizeBroke);
    if (emphasizeBroke && !statusEl!.textContent) {
      statusEl!.textContent = "broke — Reset demo to continue";
    }
  }

  return { render };
}
