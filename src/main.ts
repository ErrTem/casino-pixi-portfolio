import { createBeepAudioPort } from "./shared/audio/createBeepAudioPort.js";
import { loadMutePref } from "./shared/audio/mutePref.js";
import { sfxEventsFromTransition } from "./shared/audio/sfxEdges.js";
import { parseBootSeed } from "./shared/boot/parseBootSeed.js";
import { shouldAutoPlaceBet } from "./games/crash/hud/autoBet.js";
import { mountCrashHud } from "./games/crash/hud/CrashHud.js";
import { CRASH_CONFIG } from "./games/crash/logic/config.js";
import {
  createGame,
  type CrashSnapshot,
} from "./games/crash/logic/index.js";
import { mountCrashView } from "./games/crash/view/mountCrashView.js";
import "./styles/hud.css";

const DISPLAY_MIN = CRASH_CONFIG.minBetCents / 100;

async function main(): Promise<void> {
  const hudRoot = document.querySelector("#app");
  if (!hudRoot) throw new Error("#app missing");
  const host = document.querySelector("#game-canvas-host");
  if (!host) throw new Error("#game-canvas-host missing");

  const { seed } = parseBootSeed(window.location.search);
  const game = createGame({ seed });
  const audio = createBeepAudioPort({ muted: loadMutePref() });
  // Silent ?seed= boot only (D-21..D-24 / PLSH-03Δ) — no Seed chip / on-screen note.
  const hud = mountCrashHud(hudRoot, game, { audio });
  const { app, scene, dispose } = await mountCrashView(host as HTMLElement);

  let prevSnap: CrashSnapshot | null = game.getSnapshot();
  let prevAutoBetOn = hud.isAutoBetOn();
  hud.render(prevSnap);

  app.ticker.minFPS = 10;
  const onTick = (ticker: { deltaMS: number }): void => {
    game.tick(ticker.deltaMS);
    let snap = game.getSnapshot();
    for (const event of sfxEventsFromTransition(prevSnap, snap)) {
      audio.play(event);
    }

    // Single Auto bet placeBet site (D-10..D-13) — composition root only.
    const autoBetOn = hud.isAutoBetOn();
    if (
      shouldAutoPlaceBet({
        autoBetOn,
        prevAutoBetOn,
        phase: snap.phase,
        prevPhase: prevSnap?.phase ?? null,
        hasBet: snap.bet != null,
        broke: snap.balance < DISPLAY_MIN,
      })
    ) {
      const result = game.placeBet(hud.getStake());
      if (result.ok) {
        audio.unlock();
        audio.play("bet_lock");
        snap = game.getSnapshot();
      } else if (
        result.reason === "broke" ||
        result.reason === "insufficient_balance"
      ) {
        hud.stopAutoBet(result.reason);
      }
    }
    prevAutoBetOn = hud.isAutoBetOn();

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
