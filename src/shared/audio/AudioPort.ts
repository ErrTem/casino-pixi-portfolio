/** key SFX demo events, one closed union shared by every game */
export type SfxEvent =
  | "bet_lock"
  | "takeoff"
  | "cash_out"
  | "crash"
  | "spin"
  | "reel_stop"
  | "win"
  | "token_spawn"
  | "token_land"
  | "phone_trigger"
  | "queue_step";

export interface AudioPort {
  play(event: SfxEvent): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  unlock(): void;
  dispose(): void;
}
