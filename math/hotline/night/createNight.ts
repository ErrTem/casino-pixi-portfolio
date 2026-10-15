import {
  createComboQueue,
  orderComboQueue,
} from "../collectors/ComboQueue.js";
import type { TokenColor } from "../collectors/TokenColors.js";

export type NightStep =
  | { kind: "feature_start"; color: TokenColor; nested: boolean }
  | { kind: "fs_spin" }
  | { kind: "feature_exit"; color: TokenColor; nested: boolean; totalCents: number }
  | { kind: "night_total"; totalCents: number }
  | { kind: "wait" }
  | { kind: "done" };

export type NightPathEntry = {
  color: TokenColor;
  nested: boolean;
  state: "pending" | "active" | "paused" | "done";
};

export type NightSnapshot = {
  path: NightPathEntry[];
  activeIndex: number;
  fs: {
    spinsLeft: number;
    spinsDone: number;
    totalSpins: number;
    retriggers: number;
    totalCents: number;
  } | null;
  totalCents: number;
  featureBetCents: number;
};

export interface Night {
  next(): NightStep;
  settleFeature(cents: number): void;
  onFsSpinSettled(args: {
    winCents: number;
    queue: readonly TokenColor[];
  }): { retriggered: boolean; nested: TokenColor[] };
  snapshot(): NightSnapshot;
}

export interface CreateNightArgs {
  queue: readonly TokenColor[];
  freeSpins: {
    spins: number;
    retriggerSpins: number;
    maxRetriggers: number;
  };
  featureBetCents: number;
}

type FsFrame = {
  spinsLeft: number;
  spinsDone: number;
  totalSpins: number;
  retriggers: number;
  totalCents: number;
};

type OpenFeature = {
  color: TokenColor;
  nested: boolean;
  pathIndex: number;
  settled: boolean;
  totalCents: number;
};

export function createNight(args: CreateNightArgs): Night {
  const baseQueue = createComboQueue(args.queue);
  const nestedQueue = createComboQueue([]);
  const path: NightPathEntry[] = [];
  const { spins, retriggerSpins, maxRetriggers } = args.freeSpins;
  const featureBetCents = args.featureBetCents;

  let fs: FsFrame | null = null;
  let open: OpenFeature | null = null;
  let fsSpinPending = false;
  let nightTotalCents = 0;
  let finished = false;
  let nightTotalEmitted = false;

  function activeIndex(): number {
    return path.findIndex((e) => e.state === "active");
  }

  function insertPathEntry(entry: NightPathEntry, nested: boolean): number {
    if (!nested) {
      path.push(entry);
      return path.length - 1;
    }
    // nested entries sit after green and earlier nested entries
    let insertAt = 0;
    for (let i = 0; i < path.length; i++) {
      if (path[i].color === "green" && !path[i].nested) {
        insertAt = i + 1;
        while (insertAt < path.length && path[insertAt].nested) {
          insertAt += 1;
        }
        break;
      }
    }
    path.splice(insertAt, 0, entry);
    return insertAt;
  }

  function beginFeature(color: TokenColor, nested: boolean): NightStep {
    const idx = insertPathEntry(
      { color, nested, state: "active" },
      nested,
    );
    if (color === "green" && !nested) {
      fs = {
        spinsLeft: spins,
        spinsDone: 0,
        totalSpins: spins,
        retriggers: 0,
        totalCents: 0,
      };
      open = null;
      return { kind: "feature_start", color, nested };
    }
    // pause green while a nested feature plays
    if (nested) {
      const green = path.find((e) => e.color === "green" && !e.nested);
      if (green && green.state === "active") green.state = "paused";
    }
    open = {
      color,
      nested,
      pathIndex: idx,
      settled: false,
      totalCents: 0,
    };
    return { kind: "feature_start", color, nested };
  }

  function closeGreenFrame(): NightStep {
    if (!fs) return { kind: "wait" };
    const totalCents = fs.totalCents;
    nightTotalCents += totalCents;
    const green = path.find((e) => e.color === "green" && !e.nested);
    if (green) green.state = "done";
    fs = null;
    return {
      kind: "feature_exit",
      color: "green",
      nested: false,
      totalCents,
    };
  }

  function closeOpenFeature(): NightStep {
    if (!open || !open.settled) return { kind: "wait" };
    const { color, nested, totalCents, pathIndex } = open;
    path[pathIndex].state = "done";
    nightTotalCents += totalCents;
    open = null;
    if (nested) {
      const green = path.find((e) => e.color === "green" && !e.nested);
      if (green && green.state === "paused") green.state = "active";
    }
    return { kind: "feature_exit", color, nested, totalCents };
  }

  return {
    next(): NightStep {
      if (finished) return { kind: "done" };
      if (fsSpinPending) return { kind: "wait" };
      if (open && !open.settled) return { kind: "wait" };
      if (open && open.settled) return closeOpenFeature();

      const nestedHead = nestedQueue.peek();
      if (nestedHead) {
        nestedQueue.pop();
        return beginFeature(nestedHead, true);
      }

      if (fs && fs.spinsLeft > 0) {
        fsSpinPending = true;
        return { kind: "fs_spin" };
      }

      if (fs) {
        return closeGreenFrame();
      }

      const head = baseQueue.peek();
      if (head) {
        baseQueue.pop();
        return beginFeature(head, false);
      }

      if (path.length >= 2 && !nightTotalEmitted) {
        nightTotalEmitted = true;
        return { kind: "night_total", totalCents: nightTotalCents };
      }

      finished = true;
      return { kind: "done" };
    },

    settleFeature(cents: number): void {
      if (!open || open.settled) return;
      open.settled = true;
      open.totalCents = Math.max(0, Math.floor(cents));
    },

    onFsSpinSettled(input): { retriggered: boolean; nested: TokenColor[] } {
      if (!fs || !fsSpinPending) {
        return { retriggered: false, nested: [] };
      }
      fsSpinPending = false;
      fs.spinsLeft -= 1;
      fs.spinsDone += 1;
      const win = Math.max(0, Math.floor(input.winCents));
      fs.totalCents += win;

      let retriggered = false;
      const nestedColors: TokenColor[] = [];
      for (const color of input.queue) {
        if (color === "green") {
          if (fs.retriggers < maxRetriggers) {
            fs.retriggers += 1;
            fs.spinsLeft += retriggerSpins;
            fs.totalSpins += retriggerSpins;
            retriggered = true;
          }
          continue;
        }
        nestedColors.push(color);
      }
      const ordered = orderComboQueue(nestedColors);
      if (ordered.length > 0) {
        const merged = orderComboQueue([...nestedQueue.list(), ...ordered]);
        nestedQueue.set(merged);
      }
      return { retriggered, nested: ordered };
    },

    snapshot(): NightSnapshot {
      return {
        path: path.map((e) => ({ ...e })),
        activeIndex: activeIndex(),
        fs: fs
          ? {
              spinsLeft: fs.spinsLeft,
              spinsDone: fs.spinsDone,
              totalSpins: fs.totalSpins,
              retriggers: fs.retriggers,
              totalCents: fs.totalCents,
            }
          : null,
        totalCents: nightTotalCents,
        featureBetCents,
      };
    },
  };
}
