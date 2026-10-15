import { TOKEN_COLOR_ORDER, type TokenColor } from "./TokenColors.js";

// fixed green to red to purple filter of fired colors
export function orderComboQueue(fired: Iterable<TokenColor>): TokenColor[] {
  const set = new Set(fired);
  return TOKEN_COLOR_ORDER.filter((c) => set.has(c));
}

export interface ComboQueue {
  peek(): TokenColor | undefined;
  pop(): TokenColor | undefined;
  list(): TokenColor[];
  set(colors: Iterable<TokenColor>): void;
}

export function createComboQueue(initial: Iterable<TokenColor> = []): ComboQueue {
  let items: TokenColor[] = orderComboQueue(initial);
  return {
    peek() {
      return items[0];
    },
    pop() {
      return items.shift();
    },
    list() {
      return items.slice();
    },
    set(colors) {
      items = orderComboQueue(colors);
    },
  };
}
