import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Code,
  ExternalLink,
  FileCode2,
  FolderSync,
  Lock,
  Palette,
  RefreshCw,
  Sliders,
  Type,
  Wand2,
  Zap,
} from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { RichButton } from "@/components/common/custom/rich-button";
import Container from "@/components/common/layout/container";
import DefaultLayout from "@/components/common/layout/default-layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  duration as d,
  ease as easeTokens,
} from "@/styles/tokens/motion";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EASE_REVEAL = easeTokens.fast;
const FIGMA_URL =
  "https://www.figma.com/community/plugin/1613643367110247078";
const GITHUB_URL = "https://github.com/atom63/cipher";

const GRID_BG_STYLE = {
  backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px),
    linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
  backgroundSize: `var(--spacing-20) var(--spacing-20)`,
} as const;

// Stable motion config objects
const REVEAL_ANIMATE = { opacity: 1, y: 0 };
const REVEAL_VIEWPORT = { once: true, margin: "-80px" } as const;
const FADE_ANIMATE = { opacity: 1 };
const FADE_VIEWPORT = { once: true } as const;

// ---------------------------------------------------------------------------
// Motion primitives
// ---------------------------------------------------------------------------

function Reveal({
  children,
  delay = 0,
  className,
  y = 20,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      transition={{ duration: d.slow, delay, ease: EASE_REVEAL }}
      viewport={REVEAL_VIEWPORT}
      whileInView={REVEAL_ANIMATE}
    >
      {children}
    </motion.div>
  );
}

function Fade({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0 }}
      transition={{ duration: d.slower, delay, ease: EASE_REVEAL }}
      viewport={FADE_VIEWPORT}
      whileInView={FADE_ANIMATE}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Hero video with parallax
// ---------------------------------------------------------------------------

function HeroVideo({ reduced }: { reduced?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-border/40 shadow-6 lg:rounded-3xl"
      ref={ref}
      style={reduced ? {} : { y, scale }}
    >
      <div className="pointer-events-none absolute -inset-px rounded-[inherit] bg-linear-to-b from-primary/20 via-transparent to-transparent" />

      <video
        autoPlay
        className="relative block w-full"
        loop
        muted
        playsInline
        preload="metadata"
      >
        <source src="/placeholder/output.webm" type="video/webm" />
        <source src="/placeholder/placeholder.mp4" type="video/mp4" />
      </video>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Feature data
// ---------------------------------------------------------------------------

const HERO_FEATURES = [
  {
    label: "GENERATE",
    icon: Wand2,
    title: "Generate a full token system",
    body: "Create primitives, aliases, and semantics from a small set of design inputs — color, surfaces, radius, type scale, and font mappings.",
    bullets: [
      "Three-tier token model",
      "First-time setup or update existing",
    ],
    screenshot: "/og.png",
    screenshotAlt:
      "Cipher Generate page showing color scale preview and brand configuration",
  },
  {
    label: "ROUND-TRIP",
    icon: FolderSync,
    title: "Round-trip between Figma and code",
    body: "Import JSON, CSS, folders, or ZIP files back into Figma with preview, conflict checks, and reference-aware creation.",
    bullets: ["Preview before write", "Import or override modes"],
    screenshot: "/og.png",
    screenshotAlt:
      "Cipher Import page showing token review table with conflict detection",
  },
];

const GRID_FEATURES = [
  {
    label: "VARIABLES",
    icon: Sliders,
    title: "Manage variables at scale",
    body: "Search, rename, move, duplicate, delete, edit by mode, scale values, and swap references.",
    screenshot: "/og.png",
    screenshotAlt: "Cipher variable manager with bulk operations",
  },
  {
    label: "STYLES",
    icon: Palette,
    title: "Fix and maintain styles",
    body: "Browse styles, detect broken bindings, and apply rebind suggestions in batch.",
    screenshot: "/og.png",
    screenshotAlt: "Cipher Styles page with rebind suggestions",
  },
  {
    label: "EXPORT",
    icon: FileCode2,
    title: "Export production-ready tokens",
    body: "Structured JSON and CSS with Tailwind v4 @theme inline, split files, and color format selection.",
    screenshot: "/og.png",
    screenshotAlt: "Cipher Export page showing CSS output",
  },
];

// ---------------------------------------------------------------------------
// Differentiators
// ---------------------------------------------------------------------------

const DIFF = [
  {
    icon: Palette,
    title: "OKLCH color science",
    text: "Perceptually uniform lightness steps across every generated scale.",
  },
  {
    icon: Zap,
    title: "Opacity preservation",
    text: "Style-level opacity retained via color-mix() in CSS output.",
  },
  {
    icon: Type,
    title: "Responsive typography",
    text: "Breakpoint-aware font-size and line-height in every export.",
  },
  {
    icon: Sliders,
    title: "Surface saturation",
    text: "Adjust chroma across your neutral palette with one slider.",
  },
  {
    icon: RefreshCw,
    title: "Config auto-detection",
    text: "Re-open on existing files — brand config extracted automatically.",
  },
  {
    icon: Code,
    title: "Tailwind v4 native",
    text: "@theme inline blocks in every file. Zero config integration.",
  },
];

// ---------------------------------------------------------------------------
// FAQ data
// ---------------------------------------------------------------------------

const FAQ = [
  {
    q: 'What does "opinionated" mean?',
    a: "Cipher is built around a clear token structure and workflow philosophy. Instead of trying to support every possible setup equally, it prioritizes readability, consistency, and maintainability.",
  },
  {
    q: "Is Cipher free to use?",
    a: "Yes. Cipher is currently free to use during beta.",
  },
  {
    q: "Why is Cipher in beta?",
    a: "Cipher is already usable today, but the workflow, docs, and feature set are still evolving. The beta label helps set expectations clearly while the product continues to improve.",
  },
  {
    q: "What can Cipher export?",
    a: "Cipher exports JSON token files and CSS token files, including support for Tailwind v4-friendly @theme inline output.",
  },
  {
    q: "Can I import token files back into Figma?",
    a: "Yes. Cipher supports importing JSON, CSS, folders, and ZIP archives with preview, conflict handling, and undo.",
  },
  {
    q: "Does Cipher use cloud sync or external servers?",
    a: "No. Cipher is local-only and does not use external servers or telemetry.",
  },
  {
    q: "Who is Cipher for?",
    a: "Cipher is for designers and developers who care about structured token workflows, readable systems, and better alignment between design and code.",
  },
  {
    q: "What is the open-source website starter?",
    a: "It is a public starter repo that applies Cipher\u2019s token structure in code, so you can explore or build on the workflow outside the plugin UI.",
  },
];

// ---------------------------------------------------------------------------
// Code block
// ---------------------------------------------------------------------------

type CodeLine =
  | { text: string; dim: boolean }
  | { token: string; value: string; dim: boolean };

const CODE: CodeLine[] = [
  { text: "@theme inline {", dim: true },
  { token: "--color-background", value: "var(--background)", dim: true },
  { token: "--color-primary", value: "var(--primary)", dim: true },
  { text: "}", dim: true },
  { text: "", dim: true },
  { text: ":root {", dim: false },
  { token: "--background", value: "var(--surface-light-2)", dim: false },
  { token: "--foreground", value: "var(--surface-light-12)", dim: false },
  {
    token: "--primary",
    value: "var(--color-brand-primary-500)",
    dim: false,
  },
  { token: "--border", value: "var(--surface-light-6)", dim: true },
  { text: "}", dim: false },
  { text: "", dim: true },
  { text: ".dark {", dim: false },
  { token: "--background", value: "var(--surface-dark-1)", dim: false },
  {
    token: "--primary",
    value: "var(--color-brand-primary-400)",
    dim: false,
  },
  { text: "}", dim: false },
];

const FILE_TABS = [
  "primitives.css",
  "aliases.css",
  "semantics.css",
  "typescales.css",
  "effects.css",
];

function CodeBlock({ reduced }: { reduced?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-5">
      <div className="flex overflow-x-auto border-border/40 border-b bg-card/80">
        {FILE_TABS.map((name, i) => (
          <div
            className={`shrink-0 border-border/20 border-r px-4 py-3 font-mono text-xs ${
              i === 2
                ? "bg-background/80 text-foreground"
                : "text-muted-foreground/35"
            }`}
            key={name}
          >
            {name}
          </div>
        ))}
      </div>
      <motion.div
        className="p-5 sm:p-6"
        initial={reduced ? false : { opacity: 0 }}
        transition={{ duration: d.slow, ease: EASE_REVEAL }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1 }}
      >
        {CODE.map((line, i) => (
          <div
            className={`font-mono text-xs leading-7 sm:leading-8 ${
              line.dim ? "opacity-30" : ""
            }`}
            key={i}
          >
            {"token" in line ? (
              <span>
                {"  "}
                <span className="text-primary/85">{line.token}</span>
                <span className="text-foreground/20">: </span>
                <span className="text-foreground/50">{line.value}</span>
                <span className="text-foreground/20">;</span>
              </span>
            ) : (
              <span className="text-foreground/60">{line.text}</span>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Three-tier architecture
// ---------------------------------------------------------------------------

const TIERS = [
  {
    label: "Primitives",
    desc: "Raw values",
    tokens: ["brand/primary/500", "gray/light/9", "font/size/base"],
  },
  {
    label: "Aliases",
    desc: "Mapped references",
    tokens: ["surface/light/2", "font/family/primary", "radius/md"],
  },
  {
    label: "Semantics",
    desc: "UI-facing tokens",
    tokens: ["background", "foreground", "primary"],
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const reduced = useReducedMotion();

  usePageMeta({
    title: "A Highly Opinionated Token System for Figma",
    description:
      "Cipher helps you generate structured token systems, manage variables and styles at scale, and round-trip production-ready tokens between Figma and code.",
    ogTitle: "Cipher — A Highly Opinionated Token System for Figma",
    ogDescription:
      "Generate, manage, export, and re-import design tokens with a workflow built for readability, consistency, and real product use.",
    keywords: [
      "design tokens",
      "figma plugin",
      "css variables",
      "design system",
      "OKLCH",
      "tailwind css v4",
      "design to code",
      "token export",
    ],
  });

  return (
    <DefaultLayout noPadding>
      {/* ================================================================ */}
      {/* 1. HERO                                                          */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-2 dark:opacity-4"
            style={GRID_BG_STYLE}
          />
          <div className="absolute top-[-30%] right-[-15%] h-[700px] w-[700px] rounded-full bg-primary/10 blur-[200px] contain-strict dark:bg-primary/6" />
          <div className="absolute bottom-[-20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[150px] contain-strict" />
        </div>

        <Container
          className="relative pt-28 pb-8 sm:pt-36 sm:pb-12 lg:pt-44 lg:pb-16"
          maxWidth="default"
          padding="x"
        >
          <div className="mx-auto max-w-4xl text-center">
            <Reveal delay={0} y={0}>
              <p className="font-mono text-primary text-xs tracking-[0.25em]">
                BETA · FREE TO USE
              </p>
            </Reveal>

            <Reveal delay={0.04} y={32}>
              <h1 className="mt-5 font-extrabold text-9xl text-foreground leading-[0.92] tracking-[-0.04em]">
                A highly opinionated{" "}
                <span className="font-serif italic text-primary">
                  token system
                </span>{" "}
                for Figma.
              </h1>
            </Reveal>

            <Reveal delay={0.08} y={16}>
              <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                Generate structured token systems, manage variables and styles
                at scale, and round-trip production-ready tokens between Figma
                and code.
              </p>
            </Reveal>

            <Reveal delay={0.12} y={12}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <RichButton
                  onClick={() =>
                    window.open(FIGMA_URL, "_blank", "noopener,noreferrer")
                  }
                  size="lg"
                  type="button"
                >
                  Install plugin
                  <ArrowRight className="size-4" />
                </RichButton>
                <a
                  className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-5 py-2.5 font-medium text-foreground text-sm transition-colors hover:bg-card"
                  href="/docs"
                >
                  <BookOpen className="size-4" />
                  View docs
                </a>
              </div>
            </Reveal>

            <Fade delay={0.18}>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-muted-foreground/40 text-sm">
                <span>Local-only</span>
                <span className="text-border/40">·</span>
                <span>No external servers</span>
                <span className="text-border/40">·</span>
                <span>No telemetry</span>
                <span className="text-border/40">·</span>
                <span>Free during beta</span>
              </div>
            </Fade>
          </div>
        </Container>

        <Container
          className="relative pb-24 sm:pb-32 lg:pb-40"
          maxWidth="wide"
          padding="x"
        >
          <Reveal delay={0.22} y={40}>
            <HeroVideo reduced={reduced} />
          </Reveal>
        </Container>
      </section>

      {/* ================================================================ */}
      {/* 2. WHY — asymmetric with architecture diagram                   */}
      {/* ================================================================ */}
      <section className="border-border/30 border-y bg-card/30">
        <Container
          className="py-24 sm:py-32 lg:py-40"
          maxWidth="default"
          padding="x"
        >
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
            {/* Left — statement */}
            <Reveal>
              <div className="lg:sticky lg:top-32">
                <h2 className="font-extrabold text-8xl text-foreground leading-[1.08] tracking-tight">
                  Figma gives you variables.{" "}
                  <span className="text-primary">
                    Cipher gives you a system.
                  </span>
                </h2>
                <p className="mt-5 max-w-md text-base text-muted-foreground leading-relaxed">
                  Design token workflows often become fragmented across files,
                  tools, and codebases. Naming drifts, structure gets harder
                  to maintain, and exports still need cleanup. Cipher makes
                  that hidden logic readable, portable, and aligned.
                </p>
                <div className="mt-7 flex flex-col gap-2.5">
                  {[
                    "Structure over sprawl",
                    "Clarity beats configurability",
                    "Readable systems scale better",
                  ].map((point, i) => (
                    <Reveal delay={0.06 + i * 0.03} key={point} y={8}>
                      <div className="flex items-center gap-3">
                        <span className="block h-px w-4 bg-primary/30" />
                        <span className="text-muted-foreground/60 text-sm">
                          {point}
                        </span>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Right — three-tier architecture */}
            <Reveal delay={0.08} y={24}>
              <div className="flex flex-col gap-2.5">
                {TIERS.map((tier, ti) => (
                  <div key={tier.label}>
                    <div className="rounded-xl border border-border/40 bg-background/60 p-5 transition-colors hover:border-primary/15">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-primary/40 text-xs">
                            {String(ti + 1).padStart(2, "0")}
                          </span>
                          <span className="font-semibold text-foreground text-sm">
                            {tier.label}
                          </span>
                        </div>
                        <span className="text-muted-foreground/40 text-xs">
                          {tier.desc}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {tier.tokens.map((t) => (
                          <span
                            className="rounded-md border border-border/20 bg-card/50 px-2.5 py-1 font-mono text-foreground/50 text-xs"
                            key={t}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    {ti < TIERS.length - 1 && (
                      <div className="flex justify-center py-1">
                        <ChevronRight className="size-3.5 rotate-90 text-border/60" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ================================================================ */}
      {/* 3. FEATURES — hero cards + supporting grid                      */}
      {/* ================================================================ */}
      <section>
        <Container
          className="py-24 sm:py-32 lg:py-40"
          maxWidth="default"
          padding="x"
        >
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <p className="font-mono text-primary text-xs tracking-[0.25em]">
                FEATURES
              </p>
              <h2 className="mt-3 font-extrabold text-8xl text-foreground leading-[1.08] tracking-tight">
                From raw variables to a usable system
              </h2>
            </Reveal>
            <Reveal delay={0.04}>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Generate, manage, export, and re-import tokens through a
                workflow built around structure, readability, and control.
              </p>
            </Reveal>
          </div>

          {/* Hero feature cards — horizontal on desktop */}
          <div className="mt-16 flex flex-col gap-4 sm:mt-20">
            {HERO_FEATURES.map((feat, fi) => (
              <Reveal delay={fi * 0.05} key={feat.label}>
                <div
                  className={`group overflow-hidden rounded-xl border border-border/40 bg-card/40 transition-colors hover:border-primary/15 hover:bg-card/50 ${
                    fi % 2 === 0
                      ? "lg:grid lg:grid-cols-[1fr_1.2fr]"
                      : "lg:grid lg:grid-cols-[1.2fr_1fr]"
                  }`}
                >
                  <div
                    className={`overflow-hidden border-border/30 border-b lg:border-b-0 ${
                      fi % 2 === 0
                        ? "lg:border-r lg:order-first"
                        : "lg:order-last lg:border-l"
                    }`}
                  >
                    <img
                      alt={feat.screenshotAlt}
                      className="block aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] lg:aspect-auto lg:h-full"
                      height={450}
                      loading="lazy"
                      src={feat.screenshot}
                      width={800}
                    />
                  </div>
                  <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                    <div className="flex items-center gap-2">
                      <feat.icon className="size-4 text-primary/60" />
                      <p className="font-mono text-primary/80 text-xs tracking-[0.25em]">
                        {feat.label}
                      </p>
                    </div>
                    <h3 className="mt-3 font-bold text-foreground text-xl leading-snug tracking-tight sm:text-2xl">
                      {feat.title}
                    </h3>
                    <p className="mt-2.5 max-w-sm text-muted-foreground text-sm leading-relaxed">
                      {feat.body}
                    </p>
                    <ul className="mt-4 space-y-1.5">
                      {feat.bullets.map((b) => (
                        <li
                          className="flex items-center gap-2 text-muted-foreground/60 text-xs"
                          key={b}
                        >
                          <span className="block size-1 shrink-0 rounded-full bg-primary/35" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Supporting feature cards — 3-col grid */}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {GRID_FEATURES.map((feat, i) => (
              <Reveal delay={i * 0.04} key={feat.label}>
                <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/40 bg-card/40 transition-colors hover:border-primary/15 hover:bg-card/50">
                  <div className="overflow-hidden border-border/30 border-b">
                    <img
                      alt={feat.screenshotAlt}
                      className="block aspect-4/3 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      height={300}
                      loading="lazy"
                      src={feat.screenshot}
                      width={400}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2">
                      <feat.icon className="size-3.5 text-primary/60" />
                      <p className="font-mono text-primary/80 text-xs tracking-[0.25em]">
                        {feat.label}
                      </p>
                    </div>
                    <h3 className="mt-2 font-semibold text-foreground leading-snug">
                      {feat.title}
                    </h3>
                    <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
                      {feat.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Opinionated statement — subtle accent, not heavy */}
          <Reveal delay={0.06}>
            <div className="mt-4 rounded-xl border border-border/40 bg-card/30 p-7 sm:p-10 lg:flex lg:items-center lg:gap-14">
              <div className="shrink-0">
                <p className="font-mono text-primary/80 text-xs tracking-[0.25em]">
                  OPINIONATED
                </p>
                <h3 className="mt-2.5 font-bold text-foreground text-xl leading-snug tracking-tight sm:text-2xl">
                  Built with a point of view.
                </h3>
              </div>
              <div className="mt-4 lg:mt-0">
                <p className="max-w-md text-muted-foreground text-sm leading-relaxed">
                  Not trying to support every possible workflow equally. Built
                  around a clearer and more readable way to organize token
                  systems.
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-muted-foreground/50 text-xs">
                  <span>Structure over sprawl</span>
                  <span className="text-border/40">·</span>
                  <span>Clarity over configurability</span>
                  <span className="text-border/40">·</span>
                  <span>System-first workflow</span>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ================================================================ */}
      {/* 4. OPEN SOURCE — code proof                                     */}
      {/* ================================================================ */}
      <section className="border-border/30 border-t bg-card/30">
        <Container
          className="py-24 sm:py-32 lg:py-40"
          maxWidth="default"
          padding="x"
        >
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <Reveal>
              <div className="lg:sticky lg:top-32">
                <p className="font-mono text-primary text-xs tracking-[0.25em]">
                  OPEN SOURCE
                </p>
                <h2 className="mt-3 font-extrabold text-7xl text-foreground leading-[1.08] tracking-tight">
                  See the system{" "}
                  <span className="text-primary">in code.</span>
                </h2>
                <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
                  An open-source website starter that applies Cipher's token
                  structure in code. Use it as a reference implementation or a
                  boilerplate for rapid prototyping.
                </p>

                <Fade delay={0.12}>
                  <div className="mt-7">
                    <a
                      className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-2 font-medium text-foreground text-sm transition-colors hover:bg-card"
                      href={GITHUB_URL}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Code className="size-4" />
                      View on GitHub
                      <ExternalLink className="size-3 opacity-40" />
                    </a>
                  </div>
                </Fade>

                <Fade delay={0.16}>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      "Cipher tokens in code",
                      "Reference implementation",
                      "Design engineer starter",
                    ].map((tag) => (
                      <span
                        className="rounded-md border border-border/30 px-2.5 py-1 font-mono text-muted-foreground/40 text-xs"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Fade>
              </div>
            </Reveal>

            <Reveal delay={0.08} y={24}>
              <CodeBlock reduced={reduced} />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ================================================================ */}
      {/* 5. WHY CIPHER — clean list, no cards                            */}
      {/* ================================================================ */}
      <section>
        <Container
          className="py-24 sm:py-32 lg:py-40"
          maxWidth="default"
          padding="x"
        >
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="font-mono text-primary text-xs tracking-[0.25em]">
                WHY CIPHER
              </p>
              <h2 className="mt-3 font-extrabold text-8xl text-foreground leading-[1.08] tracking-tight">
                Opinionated systems create clarity.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-muted-foreground leading-relaxed">
                Not another variable exporter. A workflow built around how
                token logic should actually be organized.
              </p>
            </div>
          </Reveal>

          <div className="mx-auto mt-14 grid max-w-4xl gap-x-16 gap-y-8 sm:mt-18 sm:grid-cols-2 lg:mt-20">
            {DIFF.map((d, i) => (
              <Reveal delay={i * 0.03} key={d.title}>
                <div className="group flex gap-4">
                  <div className="shrink-0 pt-0.5">
                    <d.icon className="size-4 text-primary/40 transition-colors group-hover:text-primary/70" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">
                      {d.title}
                    </h3>
                    <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                      {d.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ================================================================ */}
      {/* 6. TRUST + FAQ — side-by-side                                   */}
      {/* ================================================================ */}
      <section className="border-border/30 border-y bg-card/30">
        <Container
          className="py-24 sm:py-32 lg:py-40"
          maxWidth="default"
          padding="x"
        >
          <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            {/* Trust signals */}
            <Reveal>
              <div className="lg:sticky lg:top-32">
                <p className="font-mono text-muted-foreground/50 text-xs tracking-[0.25em]">
                  TRUST
                </p>
                <h2 className="mt-3 font-bold text-foreground text-xl tracking-tight">
                  Built for confidence.
                </h2>
                <p className="mt-2.5 text-muted-foreground text-sm leading-relaxed">
                  Cipher runs locally inside Figma. No external servers, no
                  telemetry. Currently in beta and free to use.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  {[
                    {
                      icon: Lock,
                      label: "Local-only",
                      desc: "Runs entirely inside Figma",
                    },
                    {
                      icon: Zap,
                      label: "Free during beta",
                      desc: "No payment required",
                    },
                    {
                      icon: RefreshCw,
                      label: "Every action undoable",
                      desc: "Safe to experiment",
                    },
                  ].map((item) => (
                    <div
                      className="flex items-center gap-3"
                      key={item.label}
                    >
                      <item.icon className="size-3.5 shrink-0 text-primary/40" />
                      <span className="font-medium text-foreground text-sm">
                        {item.label}
                      </span>
                      <span className="text-muted-foreground/50 text-sm">
                        — {item.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* FAQ */}
            <div>
              <Reveal>
                <p className="font-mono text-muted-foreground/50 text-xs tracking-[0.25em]">
                  FAQ
                </p>
              </Reveal>
              <Reveal delay={0.04}>
                <Accordion className="mt-4">
                  {FAQ.map((item, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger>{item.q}</AccordionTrigger>
                      <AccordionContent>{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* ================================================================ */}
      {/* 7. FINAL CTA                                                     */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-[-30%] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/6 blur-[180px] contain-strict" />
        </div>

        <Container
          className="relative py-28 sm:py-36 lg:py-44"
          maxWidth="default"
          padding="x"
        >
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <Reveal delay={0.04} y={28}>
              <h2 className="max-w-xl text-balance font-extrabold text-9xl text-foreground leading-[1.08] tracking-tight">
                Bring more structure to your{" "}
                <span className="text-primary">token workflow.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.08}>
              <p className="mt-5 max-w-md text-muted-foreground leading-relaxed">
                Generate, manage, export, and re-import tokens with a workflow
                built for readability, consistency, and real product use.
              </p>
            </Reveal>

            <Reveal delay={0.12} y={12}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <RichButton
                  onClick={() =>
                    window.open(FIGMA_URL, "_blank", "noopener,noreferrer")
                  }
                  size="lg"
                  type="button"
                >
                  Install plugin
                  <ArrowRight className="size-4" />
                </RichButton>
                <a
                  className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-5 py-2.5 font-medium text-foreground text-sm transition-colors hover:bg-card"
                  href="/docs"
                >
                  <BookOpen className="size-4" />
                  View docs
                </a>
                <a
                  className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-5 py-2.5 font-medium text-foreground text-sm transition-colors hover:bg-card"
                  href={GITHUB_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Code className="size-4" />
                  Boilerplate
                </a>
              </div>
            </Reveal>

            <Fade delay={0.18}>
              <div className="mt-8 flex items-center justify-center gap-x-4 text-muted-foreground/40 text-sm">
                <span>MIT License</span>
                <span className="text-border/40">·</span>
                <span>Free & Open Source</span>
              </div>
            </Fade>
          </div>
        </Container>
      </section>
    </DefaultLayout>
  );
}
