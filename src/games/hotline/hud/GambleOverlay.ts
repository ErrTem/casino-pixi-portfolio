export interface GambleOverlay {
  /** opens the panel for a fresh round with both amounts as display text */
  show(amounts: { currentWin: string; gambleToWin: string }): void;
  /** shows the round result and locks the buttons until the next show */
  showResult(result: { survived: boolean; amount: string }): void;
  hide(): void;
  dispose(): void;
}

export interface MountGambleOverlayOptions {
  onSurvive: () => void;
  onDie: () => void;
}

function need<T extends Element>(root: Element, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`hotline gamble overlay: ${selector} missing`);
  return el;
}

// fixed static paths, public/assets/hotline is served as is and never goes through the pixi loader
const VHS_PANEL_URL = "/assets/hotline/vhs-gamble-panel.png";
const VHS_SURVIVE_URL = "/assets/hotline/vhs-btn-survive.png";
const VHS_DIE_URL = "/assets/hotline/vhs-btn-die.png";

// probes one optional png, only a file that decodes is attached so the css neon look stays when it is absent
function attachOptionalArt(
  host: HTMLElement,
  url: string,
  artClass: string,
  isDisposed: () => boolean,
): void {
  if (typeof Image === "undefined") return;
  const img = new Image();
  img.alt = "";
  img.draggable = false;
  img.className = "hotline-vhs-art";
  img.setAttribute("aria-hidden", "true");
  img.onload = (): void => {
    if (isDisposed()) return;
    host.insertBefore(img, host.firstChild);
    host.classList.add(artClass);
  };
  img.onerror = (): void => {
    img.onload = null;
    img.onerror = null;
  };
  img.src = url;
}

// vhs survive or die panel binder, lives outside the canvas host
export function mountGambleOverlay(
  screen: Element,
  options: MountGambleOverlayOptions,
): GambleOverlay {
  const root = need<HTMLElement>(screen, "[data-field=gamble-overlay]");
  const currentEl = need(root, "[data-field=gamble-current]");
  const toWinEl = need(root, "[data-field=gamble-to-win]");
  const resultEl = need(root, "[data-field=gamble-result]");
  const surviveBtn = need<HTMLButtonElement>(root, "[data-action=survive]");
  const dieBtn = need<HTMLButtonElement>(root, "[data-action=die]");

  let disposed = false;

  const panelEl = root.querySelector<HTMLElement>(".hotline-gamble-panel");
  const isDisposed = (): boolean => disposed;
  if (panelEl) {
    attachOptionalArt(panelEl, VHS_PANEL_URL, "hotline-gamble-panel--art", isDisposed);
  }
  attachOptionalArt(surviveBtn, VHS_SURVIVE_URL, "hotline-gamble-panel__btn--art", isDisposed);
  attachOptionalArt(dieBtn, VHS_DIE_URL, "hotline-gamble-panel__btn--art", isDisposed);

  const onSurviveClick = (): void => {
    if (disposed || surviveBtn.disabled) return;
    options.onSurvive();
  };
  const onDieClick = (): void => {
    if (disposed || dieBtn.disabled) return;
    options.onDie();
  };
  surviveBtn.addEventListener("click", onSurviveClick);
  dieBtn.addEventListener("click", onDieClick);

  function setButtons(disabled: boolean): void {
    surviveBtn.disabled = disabled;
    dieBtn.disabled = disabled;
  }

  function clearResult(): void {
    resultEl.textContent = "";
    root.classList.remove("hotline-gamble-overlay--survive");
    root.classList.remove("hotline-gamble-overlay--die");
  }

  return {
    show(amounts): void {
      if (disposed) return;
      currentEl.textContent = amounts.currentWin;
      toWinEl.textContent = amounts.gambleToWin;
      clearResult();
      setButtons(false);
      root.hidden = false;
      surviveBtn.focus();
    },

    showResult(result): void {
      if (disposed) return;
      setButtons(true);
      clearResult();
      if (result.survived) {
        currentEl.textContent = result.amount;
        resultEl.textContent = `SURVIVED ${result.amount}`;
        root.classList.add("hotline-gamble-overlay--survive");
      } else {
        currentEl.textContent = "0.00";
        toWinEl.textContent = "0.00";
        resultEl.textContent = `DEAD -${result.amount}`;
        root.classList.add("hotline-gamble-overlay--die");
      }
    },

    hide(): void {
      if (disposed) return;
      clearResult();
      setButtons(true);
      root.hidden = true;
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      surviveBtn.removeEventListener("click", onSurviveClick);
      dieBtn.removeEventListener("click", onDieClick);
      root.hidden = true;
    },
  };
}
