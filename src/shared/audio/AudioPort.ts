/** Key SFX events for the crash demo (D-05 / D-08). */
export type SfxEvent = "bet_lock" | "takeoff" | "cash_out" | "crash";

/** Port for synthetic beeps + mute — swap adapters without touching HUD/ticker. */
export interface AudioPort {
  play(event: SfxEvent): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  /** Resume AudioContext after a user gesture; idempotent. */
  unlock(): void;
  dispose(): void;
}
