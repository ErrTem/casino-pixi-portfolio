export interface FeatureSplash {
  title: string;
  total?: string;
  note?: string;
}

export interface FeatureOverlay {
  showSplash(splash: FeatureSplash): void;
  hideSplash(): void;
  showLockerGrid(options: { onPick: (index: number) => void }): void;
  revealLocker(index: number, prizeLabel: string): void;
  hideLockers(): void;
  dispose(): void;
}

export interface MountFeatureOverlayOptions {
  onContinue: () => void;
}

function need<T extends Element>(root: Element, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`hotline feature overlay: ${selector} missing`);
  return el;
}

// splash dialog and locker grid binder outside the canvas host
export function mountFeatureOverlay(
  screen: Element,
  options: MountFeatureOverlayOptions,
): FeatureOverlay {
  const root = need<HTMLElement>(screen, "[data-field=feature-overlay]");
  const titleEl = need(root, "[data-field=feature-title]");
  const totalEl = need(root, "[data-field=feature-total]");
  const noteEl = need(root, "[data-field=feature-note]");
  const continueBtn = need<HTMLButtonElement>(
    root,
    "[data-action=feature-continue]",
  );
  const splashEl = need<HTMLElement>(root, "[data-field=feature-splash]");
  const lockersEl = need<HTMLElement>(root, "[data-field=feature-lockers]");

  let disposed = false;
  let onPick: ((index: number) => void) | null = null;
  const lockerButtons: HTMLButtonElement[] = [];

  const onContinueClick = (): void => {
    if (disposed) return;
    options.onContinue();
  };
  continueBtn.addEventListener("click", onContinueClick);

  const onLockerClick = (event: Event): void => {
    if (disposed || !onPick) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const btn = target.closest<HTMLButtonElement>("[data-action=locker-pick]");
    if (!btn || btn.disabled) return;
    const raw = btn.getAttribute("data-index");
    if (raw == null) return;
    const index = Number(raw);
    if (!Number.isFinite(index)) return;
    onPick(index);
  };
  lockersEl.addEventListener("click", onLockerClick);

  function ensureLockerButtons(): void {
    if (lockerButtons.length === 12) return;
    lockersEl.replaceChildren();
    lockerButtons.length = 0;
    for (let i = 0; i < 12; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hotline-feature-lockers__btn";
      btn.dataset.action = "locker-pick";
      btn.dataset.index = String(i);
      btn.textContent = `Locker ${i + 1}`;
      lockersEl.append(btn);
      lockerButtons.push(btn);
    }
  }

  function focusFirstClosed(): void {
    const next = lockerButtons.find((b) => !b.disabled);
    next?.focus();
  }

  return {
    showSplash(splash): void {
      if (disposed) return;
      titleEl.textContent = splash.title;
      totalEl.textContent = splash.total ?? "";
      noteEl.textContent = splash.note ?? "";
      splashEl.hidden = false;
      lockersEl.hidden = true;
      root.hidden = false;
      continueBtn.focus();
    },

    hideSplash(): void {
      if (disposed) return;
      splashEl.hidden = true;
      titleEl.textContent = "";
      totalEl.textContent = "";
      noteEl.textContent = "";
      if (lockersEl.hidden) root.hidden = true;
    },

    showLockerGrid(opts): void {
      if (disposed) return;
      onPick = opts.onPick;
      ensureLockerButtons();
      for (const btn of lockerButtons) {
        btn.disabled = false;
        btn.textContent = `Locker ${Number(btn.dataset.index) + 1}`;
      }
      splashEl.hidden = true;
      lockersEl.hidden = false;
      root.hidden = false;
      focusFirstClosed();
    },

    revealLocker(index, prizeLabel): void {
      if (disposed) return;
      if (!Number.isFinite(index)) return;
      const i = Math.floor(index);
      const btn = lockerButtons[i];
      if (!btn) return;
      btn.textContent = prizeLabel;
      btn.disabled = true;
      focusFirstClosed();
    },

    hideLockers(): void {
      if (disposed) return;
      onPick = null;
      lockersEl.hidden = true;
      for (const btn of lockerButtons) {
        btn.disabled = true;
      }
      if (splashEl.hidden) root.hidden = true;
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      onPick = null;
      continueBtn.removeEventListener("click", onContinueClick);
      lockersEl.removeEventListener("click", onLockerClick);
      lockersEl.replaceChildren();
      lockerButtons.length = 0;
      root.hidden = true;
    },
  };
}
