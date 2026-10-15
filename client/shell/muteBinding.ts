import type { AudioPort } from "../shared/audio/AudioPort.js";
import { saveMutePref } from "../shared/audio/mutePref.js";

/** minimal button surface for node fakes and real HTMLButtonElement */
export interface MuteButton {
  textContent: string | null;
  setAttribute(name: string, value: string): void;
  addEventListener(type: "click", listener: () => void): void;
  removeEventListener(type: "click", listener: () => void): void;
}

export function muteLabel(muted: boolean): string {
  return muted ? "Sound: Off" : "Sound: On";
}

export function bindMuteButton(
  btn: MuteButton,
  audio: AudioPort,
  save: (muted: boolean) => void = saveMutePref,
): () => void {
  const sync = (): void => {
    const muted = audio.isMuted();
    btn.textContent = muteLabel(muted);
    btn.setAttribute("aria-pressed", muted ? "true" : "false");
  };

  const onClick = (): void => {
    audio.unlock();
    const next = !audio.isMuted();
    audio.setMuted(next);
    save(next);
    sync();
  };

  btn.addEventListener("click", onClick);
  sync();

  let unbound = false;
  return () => {
    if (unbound) return;
    unbound = true;
    btn.removeEventListener("click", onClick);
  };
}
