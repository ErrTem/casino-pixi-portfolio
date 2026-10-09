import { MENU_COPY } from "../gameRegistry.js";
import type { Disposable, GameDefinition, GameId } from "../types.js";

export interface MountMenuOptions {
  games: readonly GameDefinition[];
  onLaunch(id: GameId): void;
}

export function mountMenu(
  root: HTMLElement,
  options: MountMenuOptions,
): Disposable {
  const main = document.createElement("main");
  main.className = "app-shell menu-screen";

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

  for (const game of options.games) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-tile";
    btn.setAttribute("data-game", game.id);

    const titleSpan = document.createElement("span");
    titleSpan.className = "menu-tile__title";
    titleSpan.textContent = game.title;
    btn.append(titleSpan);

    if (game.enabled) {
      const handler = (): void => {
        options.onLaunch(game.id);
      };
      btn.addEventListener("click", handler);
      listeners.push({ el: btn, handler });
    } else {
      btn.disabled = true;
    }

    li.append(btn);
    list.append(li);
  }

  main.append(header, list);
  root.append(main);

  let disposed = false;
  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const { el, handler } of listeners) {
        el.removeEventListener("click", handler);
      }
      main.remove();
    },
  };
}
