import { sfxEventsFromTransition } from "../../../shared/audio/sfxEdges.js";
import type { GameSession, ShellContext } from "../../../shell/types.js";
import { shouldAutoPlaceBet } from "../hud/autoBet.js";
import { mountCrashHud } from "../hud/CrashHud.js";
import { CRASH_CONFIG } from "../logic/config.js";
import {
  BET_SLOT_IDS,
  createGame,
  type BetSlotId,
  type CrashSnapshot,
} from "../logic/index.js";
import { mountCrashView } from "../view/mountCrashView.js";

const DISPLAY_MIN = CRASH_CONFIG.minBetCents / 100;

export async function mountCrashSession(
  ctx: ShellContext,
): Promise<GameSession> {
  const tpl = document.querySelector(
    "#crash-screen-template",
  ) as HTMLTemplateElement | null;
  const cloned = tpl?.content.firstElementChild?.cloneNode(true);
  if (!(cloned instanceof HTMLElement)) {
    throw new Error("crash session: #crash-screen-template missing");
  }
  const screen = cloned;

  ctx.root.append(screen);

  const host = screen.querySelector("#game-canvas-host");
  if (!(host instanceof HTMLElement)) {
    throw new Error("crash session: #game-canvas-host missing");
  }

  host.replaceChildren(ctx.app.canvas);
  ctx.app.resizeTo = host;

  const game = createGame({ seed: ctx.seed });
  const hud = mountCrashHud(screen, game, { audio: ctx.audio });

  const menuBtn = screen.querySelector("[data-action=menu]");
  if (!(menuBtn instanceof HTMLButtonElement)) {
    throw new Error("crash session: data-action=menu missing");
  }
  const onMenuClick = (): void => {
    ctx.requestMenu();
  };
  menuBtn.addEventListener("click", onMenuClick);

  let disposed = false;
  let view: Awaited<ReturnType<typeof mountCrashView>> | null = null;
  let onTick: ((ticker: { deltaMS: number }) => void) | null = null;

  const onAbort = (): void => {
    dispose();
  };
  ctx.signal.addEventListener("abort", onAbort, { once: true });

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    ctx.signal.removeEventListener("abort", onAbort);
    if (onTick) {
      ctx.app.ticker.remove(onTick);
      onTick = null;
    }
    if (view) {
      view.scene.destroy();
      view.dispose();
      view = null;
    }
    (ctx.app as { resizeTo: Window | HTMLElement | null }).resizeTo = null;
    ctx.app.stop();
    ctx.app.canvas.remove();
    screen.remove();
  }

  view = await mountCrashView(ctx.app);
  if (disposed) {
    view.scene.destroy();
    view.dispose();
    view = null;
    return { dispose };
  }

  let prevSnap: CrashSnapshot | null = game.getSnapshot();
  const prevAutoBetOn: [boolean, boolean] = [
    hud.isAutoBetOn(0),
    hud.isAutoBetOn(1),
  ];
  hud.render(prevSnap);

  onTick = (ticker: { deltaMS: number }): void => {
    game.tick(ticker.deltaMS);
    let snap = game.getSnapshot();
    for (const event of sfxEventsFromTransition(prevSnap, snap)) {
      ctx.audio.play(event);
    }

    for (const slot of BET_SLOT_IDS) {
      const autoBetOn = hud.isAutoBetOn(slot);
      const betSnap = snap.bets[slot];
      const hasBet = betSnap.amount != null && !betSnap.cashedOut;
      if (
        shouldAutoPlaceBet({
          autoBetOn,
          prevAutoBetOn: prevAutoBetOn[slot],
          phase: snap.phase,
          prevPhase: prevSnap?.phase ?? null,
          hasBet,
          broke: snap.balance < DISPLAY_MIN,
        })
      ) {
        const result = game.placeBet(slot, hud.getStake(slot));
        if (result.ok) {
          ctx.audio.unlock();
          ctx.audio.play("bet_lock");
          snap = game.getSnapshot();
        } else if (
          result.reason === "broke" ||
          result.reason === "insufficient_balance"
        ) {
          hud.stopAutoBet(slot as BetSlotId, result.reason);
        }
      }
      prevAutoBetOn[slot] = hud.isAutoBetOn(slot);
    }

    prevSnap = snap;
    hud.render(snap);
    view!.scene.sync(snap, ticker.deltaMS);
  };
  ctx.app.ticker.add(onTick);
  ctx.app.start();

  return { dispose };
}
