import type { AudioPort } from "../../shared/audio/AudioPort.js";
import { MENU_COPY } from "../gameRegistry.js";
import { bindMuteButton } from "../muteBinding.js";
import type { Disposable, GameDefinition, GameId } from "../types.js";

export interface MountMenuOptions {
  games: readonly GameDefinition[];
  onLaunch(id: GameId): void;
  audio: AudioPort;
}

export function mountMenu(
  root: HTMLElement,
  options: MountMenuOptions,
): Disposable {
  const main = document.createElement("main");
  main.className = "app-shell menu-screen";

  const bar = document.createElement("div");
  bar.className = "menu-bar";

  const muteBtn = document.createElement("button");
  muteBtn.type = "button";
  muteBtn.className = "mute-toggle";
  muteBtn.setAttribute("data-action", "mute");
  muteBtn.setAttribute("aria-pressed", "false");
  bar.append(muteBtn);

  const unbindMute = bindMuteButton(muteBtn, options.audio);

  const header = document.createElement("header");
  header.className = "menu-header";

  const title = document.createElement("h1");
  title.className = "menu-title";
  title.textContent = MENU_COPY.title;

  const subtitle = document.createElement("p");
  subtitle.className = "menu-subtitle";
  subtitle.textContent = MENU_COPY.subtitle;

  header.append(title, subtitle);

  const list = document.createElement("ul");
  list.className = "menu-tiles";

  const listeners: Array<{
    el: HTMLButtonElement;
    handler: () => void;
  }> = [];

  const imageListeners: Array<{
    el: HTMLImageElement;
    handler: () => void;
  }> = [];

  for (const game of options.games) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-tile";
    btn.setAttribute("data-game", game.id);

    const iconWrap = document.createElement("span");
    iconWrap.className = "menu-tile__icon-wrap";

    const img = document.createElement("img");
    img.className = "menu-tile__icon";
    img.src = game.iconUrl;
    img.alt = "";
    img.width = 96;
    img.height = 96;
    img.decoding = "async";
    const onImgError = (): void => {
      img.hidden = true;
    };
    img.addEventListener("error", onImgError);
    imageListeners.push({ el: img, handler: onImgError });
    iconWrap.append(img);

    const textWrap = document.createElement("span");
    textWrap.className = "menu-tile__text";

    const titleSpan = document.createElement("span");
    titleSpan.className = "menu-tile__title";
    titleSpan.textContent = game.title;

    const blurbSpan = document.createElement("span");
    blurbSpan.className = "menu-tile__blurb";
    blurbSpan.textContent = game.blurb;

    textWrap.append(titleSpan, blurbSpan);
    btn.append(iconWrap, textWrap);

    if (!game.enabled) {
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
      const chip = document.createElement("span");
      chip.className = "menu-tile__chip";
      chip.textContent = "Coming soon";
      btn.append(chip);
    } else {
      const handler = (): void => {
        options.onLaunch(game.id);
      };
      btn.addEventListener("click", handler);
      listeners.push({ el: btn, handler });
    }

    li.append(btn);
    list.append(li);
  }

  main.append(bar, header, list);
  root.append(main);

  let disposed = false;
  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      unbindMute();
      for (const { el, handler } of listeners) {
        el.removeEventListener("click", handler);
      }
      for (const { el, handler } of imageListeners) {
        el.removeEventListener("error", handler);
      }
      main.remove();
    },
  };
}
