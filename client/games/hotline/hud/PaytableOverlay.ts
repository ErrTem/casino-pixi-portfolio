import type { PaytableSection } from "./paytableSheetModel.js";

export interface PaytableOverlay {
  /** builds the stacked sections and shows the sheet */
  open(sections: readonly PaytableSection[]): void;
  close(): void;
  isOpen(): boolean;
  dispose(): void;
}

export interface MountPaytableOverlayOptions {
  /** fired when the player dismisses the sheet, the session restores play */
  onClose: () => void;
  /** symbol id to image url, a missing url just skips the icon */
  iconFor?: (symbolId: string) => string | undefined;
}

function need<T extends Element>(root: Element, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`hotline paytable overlay: ${selector} missing`);
  return el;
}

// scrollable rules sheet binder, lives outside the canvas host
export function mountPaytableOverlay(
  screen: Element,
  options: MountPaytableOverlayOptions,
): PaytableOverlay {
  const root = need<HTMLElement>(screen, "[data-field=paytable-overlay]");
  const bodyEl = need<HTMLElement>(root, "[data-field=paytable-body]");
  const closeBtn = need<HTMLButtonElement>(root, "[data-action=paytable-close]");

  let disposed = false;

  const dismiss = (): void => {
    if (disposed || root.hidden) return;
    options.onClose();
  };
  const onKeyDown = (ev: KeyboardEvent): void => {
    if (ev.key === "Escape") dismiss();
  };
  closeBtn.addEventListener("click", dismiss);
  root.addEventListener("keydown", onKeyDown);

  function buildSection(section: PaytableSection): HTMLElement {
    const wrap = document.createElement("section");
    wrap.className = "hotline-paytable__section";
    const title = document.createElement("h3");
    title.className = "hotline-paytable__title";
    title.textContent = section.title;
    const list = document.createElement("div");
    list.className = "hotline-paytable__rows";
    const rows = section.rows.map((row) => {
      const line = document.createElement("div");
      line.className = "hotline-paytable__row";
      const label = document.createElement("span");
      label.className = "hotline-paytable__label";
      label.textContent = row.label;
      const detail = document.createElement("span");
      detail.className = "hotline-paytable__detail";
      detail.textContent = row.detail;
      if (row.symbolId === undefined) {
        line.replaceChildren(label, detail);
        return line;
      }
      line.className = "hotline-paytable__row hotline-paytable__row--symbol";
      const name = document.createElement("span");
      name.className = "hotline-paytable__name";
      const url = options.iconFor?.(row.symbolId);
      if (url) {
        const icon = document.createElement("img");
        icon.className = "hotline-paytable__icon";
        icon.src = url;
        icon.alt = "";
        icon.setAttribute("aria-hidden", "true");
        icon.decoding = "async";
        icon.width = 36;
        icon.height = 36;
        // a missing file only drops the icon
        icon.addEventListener("error", () => (icon.hidden = true), {
          once: true,
        });
        name.appendChild(icon);
      }
      name.appendChild(label);
      line.replaceChildren(name, detail);
      return line;
    });
    list.replaceChildren(...rows);
    wrap.replaceChildren(title, list);
    return wrap;
  }

  return {
    open(sections): void {
      if (disposed) return;
      bodyEl.replaceChildren(...sections.map(buildSection));
      bodyEl.scrollTop = 0;
      root.hidden = false;
      closeBtn.focus();
    },

    close(): void {
      if (disposed) return;
      root.hidden = true;
    },

    isOpen(): boolean {
      return !disposed && !root.hidden;
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      closeBtn.removeEventListener("click", dismiss);
      root.removeEventListener("keydown", onKeyDown);
      bodyEl.replaceChildren();
      root.hidden = true;
    },
  };
}
