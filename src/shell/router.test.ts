import { describe, expect, it } from "vitest";
import { createContextFactory, createRouter } from "./router.js";
import type { GameDefinition, GameId, ShellContext } from "./types.js";
import type { AudioPort } from "../shared/audio/AudioPort.js";

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
