import { describe, expect, it } from "vitest";
import type { SfxEvent } from "./AudioPort.js";
import {
  createBeepAudioPort,
  type BeepAudioContext,
  type BeepAudioNode,
  type BeepGainNode,
  type BeepOscillatorNode,
} from "./createBeepAudioPort.js";

const COLLECTOR_EVENTS = [
  "token_spawn",
  "token_land",
  "phone_trigger",
  "queue_step",
] as const;

const ALL_EVENTS: SfxEvent[] = [
  "bet_lock",
  "takeoff",
  "cash_out",
  "crash",
  "spin",
  "reel_stop",
  "win",
  // red: cast until SfxEvent + PITCH_HZ widen (D-16)
  ...(COLLECTOR_EVENTS as unknown as SfxEvent[]),
];

function makeContext(): { ctx: BeepAudioContext; pitches: number[] } {
  const pitches: number[] = [];
  const node = (): BeepAudioNode => ({
    connect: (d) => d,
    disconnect: () => {},
  });
  const ctx: BeepAudioContext = {
    state: "running",
    currentTime: 0,
    destination: node(),
    resume: async () => {},
    close: async () => {},
    createOscillator(): BeepOscillatorNode {
      const osc: BeepOscillatorNode = {
        ...node(),
        type: "sine",
        frequency: {
          get value(): number {
            return 0;
          },
          set value(v: number) {
            pitches.push(v);
          },
        },
        start: () => {},
        stop: () => {},
      };
      return osc;
    },
    createGain(): BeepGainNode {
      return {
        ...node(),
        gain: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
        },
      };
    },
  };
  return { ctx, pitches };
}

describe("createBeepAudioPort", () => {
  it("plays every sfx event with a finite pitch", () => {
    const { ctx, pitches } = makeContext();
    const port = createBeepAudioPort({ audioContext: ctx });
    for (const event of ALL_EVENTS) {
      expect(() => port.play(event)).not.toThrow();
    }
    expect(pitches).toHaveLength(ALL_EVENTS.length);
    for (const hz of pitches) {
      expect(Number.isFinite(hz)).toBe(true);
      expect(hz).toBeGreaterThan(0);
    }
  });

  it("keeps hotline events distinct from each other", () => {
    const { ctx, pitches } = makeContext();
    const port = createBeepAudioPort({ audioContext: ctx });
    port.play("spin");
    port.play("reel_stop");
    port.play("win");
    expect(new Set(pitches).size).toBe(3);
  });

  it("keeps collector events distinct from each other", () => {
    const { ctx, pitches } = makeContext();
    const port = createBeepAudioPort({ audioContext: ctx });
    for (const event of COLLECTOR_EVENTS) {
      port.play(event as SfxEvent);
    }
    expect(pitches).toHaveLength(COLLECTOR_EVENTS.length);
    expect(new Set(pitches).size).toBe(COLLECTOR_EVENTS.length);
  });

  it("stays silent while muted and after dispose", () => {
    const { ctx, pitches } = makeContext();
    const port = createBeepAudioPort({ audioContext: ctx, muted: true });
    port.play("spin");
    expect(pitches).toHaveLength(0);
    port.setMuted(false);
    port.play("spin");
    expect(pitches).toHaveLength(1);
    port.dispose();
    port.play("reel_stop");
    expect(pitches).toHaveLength(1);
  });
});
