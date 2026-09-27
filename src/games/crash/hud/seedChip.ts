/**
 * Collapsible Seed chip — reveal + copy via textContent only (D-09, D-11).
 * Never innerHTML. Copies the seed string, not a share URL.
 */

export interface SeedChipOptions {
  seed: string;
  /** When true, show quiet "using default" note (RESEARCH Q4). */
  invalid?: boolean;
}

export interface SeedChipHandle {
  /** Collapse the expanded panel (optional). */
  collapse(): void;
}

/**
 * Mount a collapsible Seed chip into host.
 * Collapsed label: "Seed". Expand reveals seed via textContent + Copy button.
 */
export function mountSeedChip(
  host: Element,
  options: SeedChipOptions,
): SeedChipHandle {
  const { seed, invalid = false } = options;

  host.replaceChildren();
  host.classList.add("seed-chip");
  host.setAttribute("aria-label", "Demo session seed");

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "seed-chip__toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.textContent = "Seed";

  const panel = document.createElement("div");
  panel.className = "seed-chip__panel";
  panel.hidden = true;

  const value = document.createElement("code");
  value.className = "seed-chip__value";
  value.textContent = seed;

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "seed-chip__copy";
  copyBtn.textContent = "Copy";

  panel.appendChild(value);
  panel.appendChild(copyBtn);

  if (invalid) {
    const note = document.createElement("span");
    note.className = "seed-chip__note";
    note.textContent = "using default";
    panel.appendChild(note);
  }

  host.appendChild(toggle);
  host.appendChild(panel);

  function setExpanded(expanded: boolean): void {
    panel.hidden = !expanded;
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    host.classList.toggle("seed-chip--expanded", expanded);
  }

  toggle.addEventListener("click", () => {
    setExpanded(panel.hidden);
  });

  copyBtn.addEventListener("click", () => {
    void navigator.clipboard.writeText(seed);
  });

  return {
    collapse(): void {
      setExpanded(false);
    },
  };
}
