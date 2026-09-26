import type { CrashGame, CrashSnapshot } from "../logic/index.js";
import { formatMoney, formatMult } from "./format.js";

export interface CrashHud {
  render(snap: CrashSnapshot): void;
}

/**
 * Thin HTML binder: commands in, snapshot fields out.
 * No wallet math — facade only.
 */
export function mountCrashHud(root: Element, game: CrashGame): CrashHud {
  const betInput = root.querySelector<HTMLInputElement>(
    "[data-field=bet-input]",
  );
  const placeBetBtn = root.querySelector("[data-action=place-bet]");
  const cashOutBtn = root.querySelector("[data-action=cash-out]");
  const statusEl = root.querySelector("[data-field=status]");
  const balanceEl = root.querySelector("[data-field=balance]");
  const phaseEl = root.querySelector("[data-field=phase]");
  const liveMultEl = root.querySelector("[data-field=live-mult]");

  if (
    !betInput ||
    !placeBetBtn ||
    !cashOutBtn ||
    !statusEl ||
    !balanceEl ||
    !phaseEl ||
    !liveMultEl
  ) {
    throw new Error("CrashHud: required #hud-bar fields missing");
  }

  placeBetBtn.addEventListener("click", () => {
    const amount = Number(betInput.value);
    const result = game.placeBet(amount);
    if (!result.ok) {
      statusEl.textContent = result.reason;
    } else {
      statusEl.textContent = "";
    }
  });

  cashOutBtn.addEventListener("click", () => {
    game.requestCashOut();
  });

  function render(snap: CrashSnapshot): void {
    balanceEl!.textContent = formatMoney(snap.balance);
    phaseEl!.textContent = snap.phase;
    liveMultEl!.textContent = formatMult(snap.multiplier);
  }

  return { render };
}
