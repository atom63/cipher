import type { ComponentType } from "react";

export type SlideLayout =
  | "cover"
  | "title"
  | "content"
  | "split"
  | "media-full"
  | "quote";

export interface SlideDeckMeta {
  date: string;
  description?: string;
  theme?: "dark" | "light";
  title: string;
}

export interface SlideDeckItem {
  content: ComponentType;
  meta: SlideDeckMeta;
  slug: string;
}
