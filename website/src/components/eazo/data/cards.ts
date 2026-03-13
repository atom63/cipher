export const CATEGORIES = [
  "trending",
  "beauty",
  "tech",
  "career",
  "living",
  "travel",
  "sports",
  "food",
] as const;

export type Category = (typeof CATEGORIES)[number];
