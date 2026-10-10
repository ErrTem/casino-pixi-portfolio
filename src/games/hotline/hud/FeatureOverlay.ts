export interface FeatureSplash {
  title: string;
  total?: string;
  note?: string;
}

export interface FeatureOverlay {
  showSplash(splash: FeatureSplash): void;
  hideSplash(): void;
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

// splash dialog binder outside the canvas host
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

  let disposed = false;

  const onContinueClick = (): void => {
    if (disposed) return;
    options.onContinue();
  };
  continueBtn.addEventListener("click", onContinueClick);

  return {
    showSplash(splash): void {
      if (disposed) return;
      titleEl.textContent = splash.title;
      totalEl.textContent = splash.total ?? "";
      noteEl.textContent = splash.note ?? "";
      root.hidden = false;
      continueBtn.focus();
    },

    hideSplash(): void {
      if (disposed) return;
      root.hidden = true;
      titleEl.textContent = "";
      totalEl.textContent = "";
      noteEl.textContent = "";
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      continueBtn.removeEventListener("click", onContinueClick);
      root.hidden = true;
    },
  };
}
