/**
 * MDX component mapping for slide decks.
 *
 * Maps all slide primitives, templates, and core components
 * so they can be used directly in .mdx files.
 *
 * The `---` (hr) element becomes a slide break marker.
 */

import type { ReactNode } from "react";
import type { SlideLayout } from "./types";

// Core slide components
import {
  Bleed,
  Center,
  Columns,
  Fill,
  Position,
  Row,
  Spacer,
  Stack,
} from "./primitives/layout";
import { Avatar, Image, Video } from "./primitives/media";
import {
  Accent,
  Body,
  Display,
  Headline,
  Label,
  Mono,
  Quote,
  Subtitle,
  Title,
} from "./primitives/typography";
import {
  Badge,
  Box,
  Divider,
  Highlight,
  Item,
  List,
} from "./primitives/visual";
import {
  ClosingSlide,
  ComparisonSlide,
  ContentSlide,
  CoverSlide,
  FullBleedSlide,
  ProfileSlide,
  QuoteSlide,
  SectionSlide,
  SplitMediaText,
  SplitTextMedia,
  StatsSlide,
} from "./templates";

// --- Core wrappers ----------------------------------------------------------

const layoutClasses: Record<SlideLayout, string> = {
  cover:
    "flex flex-1 flex-col justify-end text-left [&_h1]:text-[128px] [&_h1]:font-light [&_h1]:tracking-[-0.05em] [&_h1]:leading-[0.85] [&_h1]:mb-6 [&_p]:text-2xl [&_p]:text-muted-foreground/50 [&_p]:leading-relaxed",
  title: "flex flex-1 flex-col items-center justify-center text-center",
  content: "flex flex-1 flex-col justify-center",
  split: "grid flex-1 grid-cols-2 items-center gap-16",
  "media-full": "flex flex-1 items-center justify-center -mx-32 -my-[120px]",
  quote:
    "flex flex-1 flex-col items-center justify-center text-center max-w-[1200px] mx-auto",
};

function Slide({
  children,
  layout,
}: {
  children: ReactNode;
  layout?: SlideLayout;
}) {
  const resolved = layout ?? "content";
  return (
    <div className={layoutClasses[resolved]} data-slide-layout={resolved}>
      {children}
    </div>
  );
}

function Notes({ children }: { children: ReactNode }) {
  return (
    <div data-slide-notes hidden>
      {children}
    </div>
  );
}

export function Section({ children }: { children: ReactNode }) {
  return (
    <div data-slide-section hidden>
      {children}
    </div>
  );
}

export function Break() {
  return <hr data-slide-break />;
}

// --- MDX element overrides --------------------------------------------------

export const slideMdxComponents = {
  // --- Slide break: `---` in MDX becomes <hr> ---
  hr: () => <hr data-slide-break />,

  // --- Typography overrides for presentation scale ---
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="font-bold text-7xl leading-[0.95] tracking-[-0.03em]">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="font-semibold text-5xl">{children}</h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="font-semibold text-3xl">{children}</h3>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="text-xl text-muted-foreground">{children}</p>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="border-primary/30 border-l-4 pl-6 text-xl text-foreground/60 italic">
      {children}
    </blockquote>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="list-disc space-y-2 pl-6 text-xl text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="list-decimal space-y-2 pl-6 text-xl text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className="overflow-x-auto rounded-xl bg-card/60 p-6 text-sm leading-relaxed">
      {children}
    </pre>
  ),
  code: ({
    children,
    className,
  }: {
    children?: ReactNode;
    className?: string;
  }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) return <code className={className}>{children}</code>;
    return (
      <code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[0.85em]">
        {children}
      </code>
    );
  },

  // --- Core ---
  Slide,
  Notes,
  Section,
  Break,

  // --- Primitives: Layout ---
  Stack,
  Row,
  Columns,
  Center,
  Spacer,
  Bleed,
  Fill,
  Position,

  // --- Primitives: Typography ---
  Display,
  Headline,
  Title,
  Subtitle,
  Body,
  Label,
  Accent,
  Mono,
  Quote,

  // --- Primitives: Media ---
  Image,
  Video,
  Avatar,

  // --- Primitives: Visual ---
  Box,
  Divider,
  Badge,
  Highlight,
  List,
  Item,

  // --- Templates ---
  CoverSlide,
  SplitTextMedia,
  SplitMediaText,
  FullBleedSlide,
  StatsSlide,
  QuoteSlide,
  ContentSlide,
  ComparisonSlide,
  ProfileSlide,
  SectionSlide,
  ClosingSlide,
};
