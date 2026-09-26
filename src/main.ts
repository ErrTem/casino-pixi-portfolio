import { startRafClock } from "./app/rafClock.js";
import { mountCrashHud } from "./games/crash/hud/CrashHud.js";
import { createGame } from "./games/crash/logic/index.js";
import "./styles/hud.css";

function main(): void {
  const game = createGame({ seed: "portfolio-demo" });
  const root = document.querySelector("#hud-bar");
  if (!root) throw new Error("#hud-bar missing");

  const hud = mountCrashHud(root, game);
  hud.render(game.getSnapshot());

  // Phase 3: stop() then bind app.ticker to the same tick + render site
  const stopClock = startRafClock((deltaMs) => {
    game.tick(deltaMs);
    hud.render(game.getSnapshot());
  });

  if (import.meta.hot) {
    import.meta.hot.dispose(() => stopClock());
  }
}

main();
