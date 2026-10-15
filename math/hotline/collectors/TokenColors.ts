// phone order left to right, also the combo queue order
export const TOKEN_COLOR_ORDER = ["green", "red", "purple"] as const;

export type TokenColor = (typeof TOKEN_COLOR_ORDER)[number];
