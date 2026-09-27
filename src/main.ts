import { createBeepAudioPort } from "./shared/audio/createBeepAudioPort.js";
import { loadMutePref } from "./shared/audio/mutePref.js";
import { sfxEventsFromTransition } from "./shared/audio/sfxEdges.js";
import { mountCrashHud } from "./games/crash/hud/CrashHud.js";
import {
  createGame,
  type CrashSnapshot,
} from "./games/crash/logic/index.js";
import { mountCrashView } from "./games/crash/view/mountCrashView.js";
import "./styles/hud.css";

async function main(): Promise<void> {
  const hudRoot = document.querySelector("#hud-bar");
  if (!hudRoot) throw new Error("#hud-bar missing");
  const host = document.querySelector("#game-canvas-host");
  if (!host) throw new Error("#game-canvas-host missing");

  const game = createGame({ seed: "portfolio-demo" });
  const audio = createBeepAudioPort({ muted: loadMutePref() });
  const hud = mountCrashHud(hudRoot, game, { audio });
  const { app, scene, dispose } = await mountCrashView(host as HTMLElement);

  let prevSnap: CrashSnapshot | null = game.getSnapshot();
  hud.render(prevSnap);

  app.ticker.minFPS = 10;
  const onTick = (ticker: { deltaMS: number }): void => {
    game.tick(ticker.deltaMS);
    const snap = game.getSnapshot();
    for (const event of sfxEventsFromTransition(prevSnap, snap)) {
      audio.play(event);
    }
    prevSnap = snap;
    hud.render(snap);
    scene.sync(snap, ticker.deltaMS);
  };
  app.ticker.add(onTick);

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      app.ticker.remove(onTick);
      audio.dispose();
      dispose();
      app.destroy(
        { removeView: true, releaseGlobalResources: true },
        { children: true },
      );
    });
  }
}

void main();
