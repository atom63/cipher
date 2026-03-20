/** Shared utilities for slide DOM operations. */

export const DESIGN_WIDTH = 1920;
export const DESIGN_HEIGHT = 1080;

/** Show only the target slide's elements in a cloned content container. */
export function showOnlySlide(container: HTMLElement, targetSlide: number) {
  let slideIdx = 0;
  for (const child of Array.from(container.children)) {
    const el = child as HTMLElement;
    if (el.tagName === "HR" || el.hasAttribute("data-slide-break")) {
      el.style.display = "none";
      slideIdx++;
      continue;
    }
    if (
      el.hasAttribute("data-slide-notes") ||
      el.hasAttribute("data-slide-section")
    ) {
      el.style.display = "none";
      continue;
    }
    el.style.display = slideIdx === targetSlide ? "" : "none";
  }
}

/** Strip videos, iframes, and defer image loading in a cloned container. */
export function stripHeavyElements(container: HTMLElement) {
  for (const video of container.querySelectorAll("video")) {
    const placeholder = document.createElement("div");
    placeholder.className = "size-full rounded-xl bg-muted/20";
    video.replaceWith(placeholder);
  }
  for (const iframe of container.querySelectorAll("iframe")) {
    iframe.remove();
  }
  for (const img of container.querySelectorAll("img")) {
    img.loading = "lazy";
    img.decoding = "async";
  }
}
