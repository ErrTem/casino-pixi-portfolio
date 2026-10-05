/** key SFX demo events */
export type SfxEvent = "bet_lock" | "takeoff" | "cash_out" | "crash";

export interface AudioPort {
  play(event: SfxEvent): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  unlock(): void;
  dispose(): void;
}
