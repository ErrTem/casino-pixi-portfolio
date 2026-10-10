import { TOKEN_COLOR_ORDER, type TokenColor } from "./TokenColors.js";

export function orderComboQueue(fired: Iterable<TokenColor>): TokenColor[] {
  // stub for red phase, always empty so order tests fail
  void fired;
  return [];
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

void TOKEN_COLOR_ORDER;
