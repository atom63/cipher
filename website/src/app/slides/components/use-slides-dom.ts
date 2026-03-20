import { useEffect, useRef, useState } from "react";

export interface SlideInfo {
  index: number;
  section: string | null;
}

function isBreak(el: HTMLElement): boolean {
  return el.tagName === "HR" || el.hasAttribute("data-slide-break");
}

function isNotes(el: HTMLElement): boolean {
  return el.hasAttribute("data-slide-notes");
}

function isSection(el: HTMLElement): boolean {
  return el.hasAttribute("data-slide-section");
}

// ---------------------------------------------------------------------------
// Initial parse — run once to build slide index and info
// ---------------------------------------------------------------------------

interface SlideRange {
  /** Indices into the children array that belong to this slide */
  elements: number[];
  section: string | null;
  notes: string | null;
}

function buildSlideIndex(children: Element[]): SlideRange[] {
  const slides: SlideRange[] = [{ elements: [], section: null, notes: null }];
  let currentSection: string | null = null;

  for (let i = 0; i < children.length; i++) {
    const el = children[i] as HTMLElement;

    const current = slides[slides.length - 1]!;

    if (isBreak(el)) {
      el.style.display = "none";
      slides.push({ elements: [], section: currentSection, notes: null });
      continue;
    }

    if (isSection(el)) {
      el.style.display = "none";
      currentSection = el.textContent;
      current.section = currentSection;
      continue;
    }

    if (isNotes(el)) {
      el.style.display = "none";
      current.notes = el.textContent;
      continue;
    }

    current.elements.push(i);
  }

  return slides;
}

// ---------------------------------------------------------------------------
// Slide switching — only touch previous + current slide elements
// ---------------------------------------------------------------------------

function switchSlide(
  children: Element[],
  slideIndex: SlideRange,
  prevSlideIndex: SlideRange | null,
  animate: boolean,
) {
  // Hide previous slide's elements
  if (prevSlideIndex) {
    for (const idx of prevSlideIndex.elements) {
      (children[idx] as HTMLElement).style.display = "none";
    }
  }

  // Show current slide's elements
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (const idx of slideIndex.elements) {
    const el = children[idx] as HTMLElement;
    el.style.display = "";
    if (animate && !prefersReduced) {
      el.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 180,
        easing: "ease-out",
      });
    }
  }

  // Pause videos on previous slide, play on current
  if (prevSlideIndex) {
    for (const idx of prevSlideIndex.elements) {
      for (const video of (children[idx] as HTMLElement).querySelectorAll("video")) {
        video.pause();
      }
    }
  }
  for (const idx of slideIndex.elements) {
    for (const video of (children[idx] as HTMLElement).querySelectorAll("video")) {
      video.play().catch(() => {});
    }
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSlidesDom(currentSlide: number) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [slideCount, setSlideCount] = useState(0);
  const [currentNotes, setCurrentNotes] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [slideInfos, setSlideInfos] = useState<SlideInfo[]>([]);

  // Stable refs for slide switching without rebuilding index
  const slideRangesRef = useRef<SlideRange[]>([]);
  const childrenRef = useRef<Element[]>([]);
  const prevSlideRef = useRef(-1);
  const initializedRef = useRef(false);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const children = Array.from(container.children);

    // First render: build the full index once
    if (!initializedRef.current) {
      childrenRef.current = children;
      const ranges = buildSlideIndex(children);
      slideRangesRef.current = ranges;
      initializedRef.current = true;

      setSlideCount(ranges.length);
      setSlideInfos(
        ranges.map((r, i) => ({ index: i, section: r.section })),
      );

      // Hide all elements initially, show first slide
      for (const child of children) {
        const el = child as HTMLElement;
        if (!isBreak(el) && !isSection(el) && !isNotes(el)) {
          el.style.display = "none";
        }
      }
      if (ranges[0]) {
        switchSlide(children, ranges[0], null, false);
        setCurrentSection(ranges[0].section);
        setCurrentNotes(ranges[0].notes);
      }
      prevSlideRef.current = 0;
      return;
    }

    // Subsequent renders: just switch slides
    const ranges = slideRangesRef.current;
    const prevRange = prevSlideRef.current >= 0 ? ranges[prevSlideRef.current] : null;
    const currentRange = ranges[currentSlide];

    if (currentRange && prevSlideRef.current !== currentSlide) {
      switchSlide(
        childrenRef.current,
        currentRange,
        prevRange ?? null,
        true,
      );
    }

    prevSlideRef.current = currentSlide;
    if (currentRange) {
      setCurrentSection(currentRange.section);
      setCurrentNotes(currentRange.notes);
    }
  }, [currentSlide]);

  return { contentRef, slideCount, currentNotes, currentSection, slideInfos };
}
