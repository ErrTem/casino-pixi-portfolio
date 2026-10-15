import { describe, expect, it } from "vitest";
import type { AudioPort } from "../shared/audio/AudioPort.js";
import { bindMuteButton, muteLabel, type MuteButton } from "./muteBinding.js";

function fakeButton(): MuteButton & {
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

function statefulAudio(initialMuted = false): AudioPort & {
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

describe("muteBinding (D-15)", () => {
  it("muteLabel matches Crash Sound On / Off strings", () => {
    expect(muteLabel(false)).toBe("Sound: On");
    expect(muteLabel(true)).toBe("Sound: Off");
  });

  it("bindMuteButton syncs label and aria-pressed from audio", () => {
    const on = fakeButton();
    const audioOn = statefulAudio(false);
    bindMuteButton(on, audioOn, () => {});
    expect(on.textContent).toBe("Sound: On");
    expect(on.attrs.get("aria-pressed")).toBe("false");

    const off = fakeButton();
    const audioOff = statefulAudio(true);
    bindMuteButton(off, audioOff, () => {});
    expect(off.textContent).toBe("Sound: Off");
    expect(off.attrs.get("aria-pressed")).toBe("true");
  });

  it("click unlocks, toggles mute, saves, and updates label", () => {
    const btn = fakeButton();
    const audio = statefulAudio(false);
    const saves: boolean[] = [];
    bindMuteButton(btn, audio, (m) => {
      saves.push(m);
    });
    btn.click();
    expect(audio.unlockCount).toBe(1);
    expect(audio.isMuted()).toBe(true);
    expect(saves).toEqual([true]);
    expect(btn.textContent).toBe("Sound: Off");
    expect(btn.attrs.get("aria-pressed")).toBe("true");
  });

  it("unbind stops clicks from changing audio or calling save", () => {
    const btn = fakeButton();
    const audio = statefulAudio(false);
    const saves: boolean[] = [];
    const unbind = bindMuteButton(btn, audio, (m) => {
      saves.push(m);
    });
    unbind();
    btn.click();
    expect(audio.isMuted()).toBe(false);
    expect(saves).toEqual([]);
    expect(audio.unlockCount).toBe(0);
  });

  it("second bind on same audio reads toggled state after rebuild", () => {
    const audio = statefulAudio(false);
    const saves: boolean[] = [];
    const first = fakeButton();
    const unbind = bindMuteButton(first, audio, (m) => {
      saves.push(m);
    });
    first.click();
    unbind();

    const second = fakeButton();
    bindMuteButton(second, audio, (m) => {
      saves.push(m);
    });
    expect(second.textContent).toBe("Sound: Off");
    expect(second.attrs.get("aria-pressed")).toBe("true");
  });
});
