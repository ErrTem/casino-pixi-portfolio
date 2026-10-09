import { describe, expect, it } from "vitest";
import { createContextFactory, createRouter } from "./router.js";
import type { Disposable, GameDefinition, GameId, ShellContext } from "./types.js";
import type { AudioPort } from "../shared/audio/AudioPort.js";
import { bindMuteButton, type MuteButton } from "./muteBinding.js";

function fakeAudio(): AudioPort {
  return {
    play() {},
    setMuted() {},
    isMuted() {
      return false;
    },
    unlock() {},
    dispose() {},
  };
}

function statefulFakeAudio(initialMuted = false): AudioPort & {
  unlockCount: number;
} {
  let muted = initialMuted;
  let unlockCount = 0;
  return {
    get unlockCount() {
      return unlockCount;
    },
    play() {},
    setMuted(next: boolean) {
      muted = next;
    },
    isMuted() {
      return muted;
    },
    unlock() {
      unlockCount += 1;
    },
    dispose() {},
  };
}

function fakeMuteButton(): MuteButton & {
  attrs: Map<string, string>;
  click(): void;
} {
  const listeners = new Set<() => void>();
  const attrs = new Map<string, string>();
  return {
    textContent: null,
    attrs,
    setAttribute(name: string, value: string) {
      attrs.set(name, value);
    },
    addEventListener(_type: "click", listener: () => void) {
      listeners.add(listener);
    },
    removeEventListener(_type: "click", listener: () => void) {
      listeners.delete(listener);
    },
    click() {
      for (const listener of [...listeners]) listener();
    },
  };
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (err: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("createRouter happy path", () => {
  it("start shows the menu once and state is menu", () => {
    let menuMounts = 0;
    const router = createRouter({
      games: [],
      showMenu() {
        menuMounts++;
        return { dispose() {} };
      },
      buildContext: createContextFactory({
        app: {} as never,
        root: {} as never,
        audio: fakeAudio(),
        seed: "abc",
      }),
    });
    expect(router.state).toBe("idle");
    router.start();
    expect(menuMounts).toBe(1);
    expect(router.state).toBe("menu");
    router.start();
    expect(menuMounts).toBe(1);
  });

  it("launch crash disposes menu, mounts once, state game; requestMenu returns", async () => {
    let menuMounts = 0;
    let menuDisposes = 0;
    let sessionDisposes = 0;
    let mountCount = 0;
    const contexts: ShellContext[] = [];
    const audio = fakeAudio();

    const crash: GameDefinition = {
      id: "crash",
      title: "Crash",
      blurb: "b",
      iconUrl: "/x.png",
      enabled: true,
      async mount(ctx) {
        mountCount++;
        contexts.push(ctx);
        return {
          dispose() {
            sessionDisposes++;
          },
        };
      },
    };

    const router = createRouter({
      games: [crash],
      showMenu() {
        menuMounts++;
        return {
          dispose() {
            menuDisposes++;
          },
        };
      },
      buildContext: createContextFactory({
        app: {} as never,
        root: {} as never,
        audio,
        seed: "abc",
      }),
    });

    router.start();
    expect(menuMounts).toBe(1);
    await router.launch("crash");
    expect(menuDisposes).toBe(1);
    expect(mountCount).toBe(1);
    expect(router.state).toBe("game");

    contexts[0]!.requestMenu();
    expect(sessionDisposes).toBe(1);
    expect(menuMounts).toBe(2);
    expect(router.state).toBe("menu");

    contexts[0]!.requestMenu();
    expect(sessionDisposes).toBe(1);
    expect(menuMounts).toBe(2);
  });

  it("second launch reuses seed string and same audio object", async () => {
    const audio = fakeAudio();
    const contexts: ShellContext[] = [];
    const crash: GameDefinition = {
      id: "crash",
      title: "Crash",
      blurb: "b",
      iconUrl: "/x.png",
      enabled: true,
      async mount(ctx) {
        contexts.push(ctx);
        return { dispose() {} };
      },
    };
    const router = createRouter({
      games: [crash],
      showMenu() {
        return { dispose() {} };
      },
      buildContext: createContextFactory({
        app: {} as never,
        root: {} as never,
        audio,
        seed: "abc",
      }),
    });
    router.start();
    await router.launch("crash");
    contexts[0]!.requestMenu();
    await router.launch("crash");
    expect(contexts).toHaveLength(2);
    expect(contexts[1]!.seed).toBe("abc");
    expect(contexts[1]!.audio).toBe(audio);
    expect(contexts[0]!.audio).toBe(contexts[1]!.audio);
  });

  it("unknown or disabled id does not mount and stays on menu", async () => {
    let mountCount = 0;
    const disabled: GameDefinition = {
      id: "hotline",
      title: "HOTLINE",
      blurb: "b",
      iconUrl: "/x.png",
      enabled: false,
      async mount() {
        mountCount++;
        return { dispose() {} };
      },
    };
    const router = createRouter({
      games: [disabled],
      showMenu() {
        return { dispose() {} };
      },
      buildContext: createContextFactory({
        app: {} as never,
        root: {} as never,
        audio: fakeAudio(),
        seed: "abc",
      }),
    });
    router.start();
    await router.launch("hotline");
    expect(mountCount).toBe(0);
    expect(router.state).toBe("menu");
    await router.launch("crash" as GameId);
    expect(mountCount).toBe(0);
    expect(router.state).toBe("menu");
  });
});

describe("createRouter launch races", () => {
  it("leave during load aborts signal, shows menu, disposes late session once", async () => {
    const mount = deferred<{ dispose: () => void }>();
    let sessionDisposes = 0;
    let menuMounts = 0;
    let sawAbort = false;
    let ctx: ShellContext | null = null;

    const crash: GameDefinition = {
      id: "crash",
      title: "Crash",
      blurb: "b",
      iconUrl: "/x.png",
      enabled: true,
      async mount(c) {
        ctx = c;
        c.signal.addEventListener("abort", () => {
          sawAbort = true;
        });
        return mount.promise;
      },
    };

    const router = createRouter({
      games: [crash],
      showMenu() {
        menuMounts++;
        return { dispose() {} };
      },
      buildContext: createContextFactory({
        app: {} as never,
        root: {} as never,
        audio: fakeAudio(),
        seed: "abc",
      }),
    });

    router.start();
    const launchP = router.launch("crash");
    expect(router.state).toBe("launching");
    ctx!.requestMenu();
    expect(sawAbort).toBe(true);
    expect(menuMounts).toBe(2);
    expect(router.state).toBe("menu");

    mount.resolve({
      dispose() {
        sessionDisposes++;
      },
    });
    await launchP;
    expect(sessionDisposes).toBe(1);
    expect(router.state).toBe("menu");

    ctx!.requestMenu();
    expect(menuMounts).toBe(2);
  });

  it("two synchronous launch calls mount once", async () => {
    let mountCount = 0;
    const crash: GameDefinition = {
      id: "crash",
      title: "Crash",
      blurb: "b",
      iconUrl: "/x.png",
      enabled: true,
      async mount() {
        mountCount++;
        return { dispose() {} };
      },
    };
    const router = createRouter({
      games: [crash],
      showMenu() {
        return { dispose() {} };
      },
      buildContext: createContextFactory({
        app: {} as never,
        root: {} as never,
        audio: fakeAudio(),
        seed: "abc",
      }),
    });
    router.start();
    const a = router.launch("crash");
    const b = router.launch("crash");
    await Promise.all([a, b]);
    expect(mountCount).toBe(1);
    expect(router.state).toBe("game");
  });

  it("mount reject calls onError and returns to menu", async () => {
    const err = new Error("boom");
    let seen: unknown = null;
    let menuMounts = 0;
    const crash: GameDefinition = {
      id: "crash",
      title: "Crash",
      blurb: "b",
      iconUrl: "/x.png",
      enabled: true,
      async mount() {
        throw err;
      },
    };
    const router = createRouter({
      games: [crash],
      showMenu() {
        menuMounts++;
        return { dispose() {} };
      },
      buildContext: createContextFactory({
        app: {} as never,
        root: {} as never,
        audio: fakeAudio(),
        seed: "abc",
      }),
      onError(e) {
        seen = e;
      },
    });
    router.start();
    await router.launch("crash");
    expect(seen).toBe(err);
    expect(router.state).toBe("menu");
    expect(menuMounts).toBe(2);
  });

  it("dispose while launching aborts, disposes late session once, no remenu", async () => {
    const mount = deferred<{ dispose: () => void }>();
    let sessionDisposes = 0;
    let menuMounts = 0;
    let sawAbort = false;
    let ctx: ShellContext | null = null;

    const crash: GameDefinition = {
      id: "crash",
      title: "Crash",
      blurb: "b",
      iconUrl: "/x.png",
      enabled: true,
      async mount(c) {
        ctx = c;
        c.signal.addEventListener("abort", () => {
          sawAbort = true;
        });
        return mount.promise;
      },
    };

    const router = createRouter({
      games: [crash],
      showMenu() {
        menuMounts++;
        return { dispose() {} };
      },
      buildContext: createContextFactory({
        app: {} as never,
        root: {} as never,
        audio: fakeAudio(),
        seed: "abc",
      }),
    });

    router.start();
    expect(menuMounts).toBe(1);
    const launchP = router.launch("crash");
    router.dispose();
    expect(sawAbort).toBe(true);
    expect(router.state).toBe("disposed");
    router.dispose();

    mount.resolve({
      dispose() {
        sessionDisposes++;
      },
    });
    await launchP;
    expect(sessionDisposes).toBe(1);
    expect(menuMounts).toBe(1);
    expect(ctx).not.toBeNull();
  });
});

describe("router mute cycle (SHELL-03 / D-12 / D-15)", () => {
  it("mute holds across two menu launch leave cycles on one AudioPort", async () => {
    const audio = statefulFakeAudio(false);
    const saves: boolean[] = [];
    const menuButtons: Array<ReturnType<typeof fakeMuteButton>> = [];
    let menuMounts = 0;
    const contexts: ShellContext[] = [];

    const showMenu = (): Disposable => {
      menuMounts++;
      const button = fakeMuteButton();
      menuButtons.push(button);
      const unbind = bindMuteButton(button, audio, (m) => {
        saves.push(m);
      });
      let disposed = false;
      return {
        dispose() {
          if (disposed) return;
          disposed = true;
          unbind();
        },
      };
    };

    const crash: GameDefinition = {
      id: "crash",
      title: "Crash",
      blurb: "b",
      iconUrl: "/x.png",
      enabled: true,
      async mount(ctx) {
        contexts.push(ctx);
        return { dispose() {} };
      },
    };

    const router = createRouter({
      games: [crash],
      showMenu,
      buildContext: createContextFactory({
        app: {} as never,
        root: {} as never,
        audio,
        seed: "abc",
      }),
    });

    router.start();
    expect(menuMounts).toBe(1);
    expect(menuButtons[0]!.textContent).toBe("Sound: On");

    menuButtons[0]!.click();
    expect(audio.isMuted()).toBe(true);
    expect(saves).toEqual([true]);

    await router.launch("crash");
    expect(contexts[0]!.audio).toBe(audio);
    expect(contexts[0]!.audio.isMuted()).toBe(true);

    contexts[0]!.audio.setMuted(!contexts[0]!.audio.isMuted());
    expect(audio.isMuted()).toBe(false);
    contexts[0]!.requestMenu();
    expect(menuMounts).toBe(2);
    expect(menuButtons[1]!.textContent).toBe("Sound: On");

    const savesBeforeDisposedClick = saves.length;
    menuButtons[0]!.click();
    expect(audio.isMuted()).toBe(false);
    expect(saves.length).toBe(savesBeforeDisposedClick);

    menuButtons[1]!.click();
    expect(audio.isMuted()).toBe(true);
    expect(saves.at(-1)).toBe(true);

    await router.launch("crash");
    expect(contexts[1]!.audio).toBe(contexts[0]!.audio);
    expect(contexts[1]!.audio.isMuted()).toBe(true);

    contexts[1]!.requestMenu();
    expect(menuMounts).toBe(3);
    expect(menuButtons[2]!.textContent).toBe("Sound: Off");
  });
});

