import type { AudioPort } from "../shared/audio/AudioPort.js";

/** minimal button surface for node fakes and real HTMLButtonElement */
export interface MuteButton {
  textContent: string | null;
  setAttribute(name: string, value: string): void;
  addEventListener(type: "click", listener: () => void): void;
  removeEventListener(type: "click", listener: () => void): void;
}

export function muteLabel(_muted: boolean): string {
  return "";
}

export function bindMuteButton(
  _btn: MuteButton,
  _audio: AudioPort,
  _save: (muted: boolean) => void = () => {},
): () => void {
  return () => {};
}
