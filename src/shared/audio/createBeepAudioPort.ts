import type { AudioPort, SfxEvent } from "./AudioPort.js";

export interface BeepAudioContext {
  state: string;
  currentTime: number;
  destination: BeepAudioNode;
  resume(): Promise<void>;
  close(): Promise<void>;
  createOscillator(): BeepOscillatorNode;
  createGain(): BeepGainNode;
}

export interface BeepAudioNode {
  connect(destination: BeepAudioNode): BeepAudioNode;
  disconnect(): void;
}

export interface BeepOscillatorNode extends BeepAudioNode {
  type: string;
  frequency: { value: number };
  start(when?: number): void;
  stop(when?: number): void;
}

export interface BeepGainNode extends BeepAudioNode {
  gain: {
    setValueAtTime(value: number, startTime: number): void;
    exponentialRampToValueAtTime(value: number, endTime: number): void;
  };
}

export interface CreateBeepAudioPortOptions {
  muted?: boolean;
  audioContext?: BeepAudioContext | null;
  beepMs?: number;
}

const PITCH_HZ: Record<SfxEvent, number> = {
  bet_lock: 440,
  takeoff: 660,
  cash_out: 880,
  crash: 160,
};

export function createBeepAudioPort(
  options: CreateBeepAudioPortOptions = {},
): AudioPort {
  let muted = options.muted === true;
  let disposed = false;
  const beepMs = options.beepMs ?? 100;
  let ctx: BeepAudioContext | null = options.audioContext ?? null;
  let unlockInFlight: Promise<void> | null = null;

  function ensureContext(): BeepAudioContext | null {
    if (disposed) return null;
    if (ctx) return ctx;
    const g = globalThis as {
      AudioContext?: new () => BeepAudioContext;
      webkitAudioContext?: new () => BeepAudioContext;
    };
    const Ctor = g.AudioContext ?? g.webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  return {
    play(event: SfxEvent): void {
      if (muted || disposed) return;
      const audio = ensureContext();
      if (!audio) return;
      try {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = "sine";
        osc.frequency.value = PITCH_HZ[event];
        const now = audio.currentTime;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + beepMs / 1000);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(now);
        osc.stop(now + beepMs / 1000 + 0.02);
      } catch {
      }
    },

    setMuted(next: boolean): void {
      muted = next;
    },

    isMuted(): boolean {
      return muted;
    },

    unlock(): void {
      if (disposed) return;
      const audio = ensureContext();
      if (!audio) return;
      if (audio.state === "running") return;
      if (unlockInFlight) return;
      try {
        const p = audio.resume();
        unlockInFlight = Promise.resolve(p).finally(() => {
          unlockInFlight = null;
        });
      } catch {
        unlockInFlight = null;
      }
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      const toClose = ctx;
      ctx = null;
      if (!toClose) return;
      try {
        void toClose.close();
      } catch {

      }
    },
  };
}
