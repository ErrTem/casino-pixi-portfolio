import "./styles/hud.css";
import { bootShell } from "./shell/bootShell.js";

const disposeShell = bootShell().catch((err: unknown) => {
  console.error(err);
  return null;
});

if (import.meta.hot) {
  import.meta.hot.dispose(async () => {
    const dispose = await disposeShell;
    dispose?.();
  });
}
