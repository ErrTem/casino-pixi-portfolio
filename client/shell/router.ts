import type {
  Disposable,
  GameDefinition,
  GameId,
  GameSession,
  ShellContext,
} from "./types.js";

export type RouterState = "idle" | "menu" | "launching" | "game" | "disposed";

export interface RouterDeps {
  games: readonly GameDefinition[];
  showMenu(onLaunch: (id: GameId) => void): Disposable;
  buildContext(
    requestMenu: () => void,
    signal: AbortSignal,
  ): ShellContext;
  onError?(err: unknown): void;
}

export interface Router {
  start(): void;
  launch(id: GameId): Promise<void>;
  goMenu(): void;
  dispose(): void;
  readonly state: RouterState;
}

export function createContextFactory(base: {
  app: ShellContext["app"];
  root: ShellContext["root"];
  audio: ShellContext["audio"];
  seed: string;
}): RouterDeps["buildContext"] {
  return (requestMenu, signal) => ({ ...base, requestMenu, signal });
}

export function createRouter(deps: RouterDeps): Router {
  let state: RouterState = "idle";
  let epoch = 0;
  let menu: Disposable | null = null;
  let session: GameSession | null = null;
  let controller: AbortController | null = null;
  let disposed = false;

  const reportError = deps.onError ?? ((err: unknown) => console.error(err));

  function goMenu(): void {
    if (disposed) return;
    epoch++;
    if (controller) {
      controller.abort();
      controller = null;
    }
    if (session) {
      session.dispose();
      session = null;
    }
    if (!menu) {
      menu = deps.showMenu((id) => {
        void launch(id);
      });
    }
    state = "menu";
  }

  async function launch(id: GameId): Promise<void> {
    if (state !== "menu") return;
    const def = deps.games.find((g) => g.id === id);
    if (!def || !def.enabled || !def.mount) return;

    const mine = ++epoch;
    state = "launching";
    menu?.dispose();
    menu = null;

    controller = new AbortController();
    const signal = controller.signal;
    const requestMenu = (): void => {
      if (epoch === mine) goMenu();
    };
    const ctx = deps.buildContext(requestMenu, signal);

    let next: GameSession;
    try {
      next = await def.mount(ctx);
    } catch (err) {
      reportError(err);
      if (mine === epoch && !disposed) goMenu();
      return;
    }

    if (mine !== epoch || disposed) {
      next.dispose();
      return;
    }
    session = next;
    state = "game";
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    epoch++;
    if (controller) {
      controller.abort();
      controller = null;
    }
    if (session) {
      session.dispose();
      session = null;
    }
    if (menu) {
      menu.dispose();
      menu = null;
    }
    state = "disposed";
  }

  return {
    start() {
      if (state === "idle") goMenu();
    },
    launch,
    goMenu,
    dispose,
    get state() {
      return state;
    },
  };
}
