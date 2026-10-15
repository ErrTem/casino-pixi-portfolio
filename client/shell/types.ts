import type { Application } from "pixi.js";
import type { AudioPort } from "../shared/audio/AudioPort.js";

/** portfolio game ids */
export type GameId = "crash" | "hotline";

/** anything the shell can tear down */
export interface Disposable {
  dispose(): void;
}

/** per-launch bag passed into a game mount */
export interface ShellContext {
  app: Application;
  root: HTMLElement;
  audio: AudioPort;
  seed: string;
  signal: AbortSignal;
  requestMenu(): void;
}

/** live game session handle */
export interface GameSession {
  /** idempotent teardown of session-owned resources only */
  dispose(): void;
}

/** registry entry for the menu and router */
export interface GameDefinition {
  id: GameId;
  title: string;
  blurb: string;
  iconUrl: string;
  enabled: boolean;
  mount?: (ctx: ShellContext) => Promise<GameSession>;
}
