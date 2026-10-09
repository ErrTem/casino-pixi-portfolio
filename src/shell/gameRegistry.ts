import type { GameDefinition } from "./types.js";

export const MENU_COPY = {
  title: "Casino demos",
  subtitle: "Portfolio pieces. Play money only.",
} as const;

export const GAMES: readonly GameDefinition[] = [
  {
    id: "crash",
    title: "Crash",
    blurb: "Cash out before the rocket blows",
    iconUrl: "/assets/menu/icon-crash.png",
    enabled: true,
    async mount(ctx) {
      const { mountCrashSession } = await import(
        "../games/crash/session/mountCrashSession.js"
      );
      return mountCrashSession(ctx);
    },
  },
];
