import {
  ArrowRight,
  Code,
  Layers,
  Lock,
  Palette,
  RefreshCw,
  Sliders,
  Type,
  Upload,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import Container from "@/components/common/layout/container";
import DefaultLayout from "@/components/common/layout/default-layout";
import Section from "@/components/common/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RichButton } from "@/components/common/custom/rich-button";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

const ease = [0.16, 1, 0.3, 1] as const;

function FadeUp({
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
      initial={reduced ? false : { opacity: 0, y: 24 }}
      transition={{ duration: 0.7, delay, ease }}
      viewport={{ once: true, margin: "-60px" }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}

function FadeIn({
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
      transition={{ duration: 1, delay, ease }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1 }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Workflow card visuals
// ---------------------------------------------------------------------------

function GenerateVisual() {
  const swatchOpacities = [100, 80, 60, 40, 20];
  const graySteps = [
    "var(--surface-light-12)",
    "var(--surface-light-9)",
    "var(--surface-light-7)",
    "var(--surface-light-5)",
    "var(--surface-light-3)",
  ];

  return (
    <div className="space-y-3 p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[10px] text-foreground/70 uppercase tracking-wider">
            Brand Color
          </span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary">
            #F76B15
          </span>
        </div>
        <div className="flex gap-1">
          {swatchOpacities.map((opacity, i) => (
            <div
              className={`h-6 flex-1 rounded-sm ${i === 0 ? "ring-1 ring-primary/40 ring-offset-1 ring-offset-card" : ""}`}
              key={opacity}
              style={{
                backgroundColor: `color-mix(in srgb, var(--primary) ${opacity}%, transparent)`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[10px] text-foreground/70 uppercase tracking-wider">
            Surface Tone
          </span>
          <span className="text-[9px] text-muted-foreground">Sand</span>
        </div>
        <div className="flex gap-1">
          {graySteps.map((color) => (
            <div
              className="h-6 flex-1 rounded-sm"
              key={color}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-border/40 bg-background/50 px-2.5 py-1.5">
        <Type className="size-3 text-muted-foreground/60" />
        <span className="text-[11px] text-foreground/80">
          Major Third — 1.250
        </span>
      </div>

      <div className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-medium text-[11px] text-primary-foreground">
        <Zap className="size-3" />
        Generate Token System
      </div>
    </div>
  );
}

function ExportVisual() {
  const files = [
    { name: "primitives.css", vars: 142 },
    { name: "aliases.css", vars: 30 },
    { name: "semantics.css", vars: 37 },
    { name: "typescales.css", vars: 18 },
    { name: "effects.css", vars: 6 },
  ];

  return (
    <div className="p-4">
      <div className="mb-3 flex gap-1 rounded-md border border-border/40 p-0.5">
        {["OKLCH", "HEX", "RGBA"].map((fmt, i) => (
          <div
            className={`flex-1 rounded py-1 text-center font-medium text-[10px] ${
              i === 0
                ? "bg-foreground text-background"
                : "text-muted-foreground"
            }`}
            key={fmt}
          >
            {fmt}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {files.map((file) => (
          <div
            className="flex items-center justify-between rounded-md border border-border/30 bg-background/30 px-2.5 py-1.5"
            key={file.name}
          >
            <span className="font-mono text-[10px] text-foreground/70">
              {file.name}
            </span>
            <span className="text-[9px] text-muted-foreground">
              {file.vars} vars
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <div className="flex flex-1 items-center justify-center gap-1 rounded-md border border-border/40 bg-background/50 py-1.5 text-[10px] text-muted-foreground">
          <Code className="size-3" />
          Copy All
        </div>
        <div className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary py-1.5 font-medium text-[10px] text-primary-foreground">
          Download ZIP
        </div>
      </div>
    </div>
  );
}

function ImportVisual() {
  const tokens = [
    { name: "--background", status: "new" },
    { name: "--foreground", status: "new" },
    { name: "--primary", status: "conflict" },
    { name: "--border", status: "new" },
    { name: "--ring", status: "skip" },
  ];

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold text-[10px] text-foreground/70 uppercase tracking-wider">
          Review Tokens
        </span>
        <span className="text-[9px] text-muted-foreground">
          5 from semantics.css
        </span>
      </div>

      <div className="space-y-1">
        {tokens.map((token) => (
          <div
            className="flex items-center justify-between rounded-md border border-border/30 bg-background/30 px-2.5 py-1.5"
            key={token.name}
          >
            <span className="font-mono text-[10px] text-primary/80">
              {token.name}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 font-semibold text-[8px] uppercase tracking-wider ${
                token.status === "new"
                  ? "bg-success/10 text-success"
                  : token.status === "conflict"
                    ? "bg-warning/10 text-warning"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {token.status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <div className="flex flex-1 items-center justify-center rounded-md border border-border/40 bg-background/50 py-1.5 text-[10px] text-muted-foreground">
          Cancel
        </div>
        <div className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary py-1.5 font-medium text-[10px] text-primary-foreground">
          <Upload className="size-3" />
          Import 4 Tokens
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Code showcase
// ---------------------------------------------------------------------------

const CSS_FILES = [
  { active: false, name: "primitives.css" },
  { active: false, name: "aliases.css" },
  { active: true, name: "semantics.css" },
  { active: false, name: "typescales.css" },
  { active: false, name: "effects.css" },
];

const CODE_LINES: (
  | { dim: boolean; indent: number; text: string }
  | { dim: boolean; indent: number; token: string; value: string }
)[] = [
  { indent: 0, text: "@theme inline {", dim: true },
  { indent: 1, token: "--color-background", value: "var(--background)", dim: true },
  { indent: 1, token: "--color-primary", value: "var(--primary)", dim: true },
  { indent: 0, text: "}", dim: true },
  { indent: 0, text: "", dim: true },
  { indent: 0, text: ":root {", dim: false },
  { indent: 1, token: "--background", value: "var(--surface-light-2)", dim: false },
  { indent: 1, token: "--foreground", value: "var(--surface-light-12)", dim: false },
  { indent: 1, token: "--primary", value: "var(--color-brand-primary-500)", dim: false },
  { indent: 1, token: "--border", value: "var(--surface-light-6)", dim: true },
  { indent: 0, text: "}", dim: false },
  { indent: 0, text: "", dim: true },
  { indent: 0, text: ".dark {", dim: false },
  { indent: 1, token: "--background", value: "var(--surface-dark-1)", dim: false },
  { indent: 1, token: "--primary", value: "var(--color-brand-primary-400)", dim: false },
  { indent: 0, text: "}", dim: false },
];

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const WORKFLOW = [
  {
    title: "Generate",
    description:
      "Pick a brand color, surface tone, type scale, and radius. Cipher builds a full three-tier token system in your Figma file.",
    Visual: GenerateVisual,
  },
  {
    title: "Export",
    description:
      "Production CSS in seven files with Tailwind v4 @theme blocks. OKLCH, HEX, RGBA, or HSL. Download as ZIP.",
    Visual: ExportVisual,
  },
  {
    title: "Import",
    description:
      "Edit in code, sync back to Figma. Auto-detects Cipher exports. Per-token conflict resolution. Full undo.",
    Visual: ImportVisual,
  },
];

const FEATURES = [
  {
    icon: Palette,
    title: "OKLCH Color Science",
    description:
      "Perceptually uniform lightness steps, not hue-shifting heuristics.",
  },
  {
    icon: Type,
    title: "Responsive Typography",
    description:
      "Breakpoint-aware font-size and line-height with @media queries.",
  },
  {
    icon: Zap,
    title: "Tailwind v4 Native",
    description:
      "@theme inline blocks in every file. Drop in, no config gymnastics.",
  },
  {
    icon: Sliders,
    title: "Surface Saturation",
    description:
      "Adjust chroma of your entire gray palette with one slider.",
  },
  {
    icon: Layers,
    title: "Batch Operations",
    description:
      "Rename, move, scale, or delete across collections with dependency checking.",
  },
  {
    icon: RefreshCw,
    title: "Auto-Detection",
    description:
      "Re-open on an existing file and Cipher pre-fills your config.",
  },
];

const FIGMA_VARS = [
  { path: "color/brand/primary/500", value: "#F76B15", swatch: "var(--primary)" },
  { path: "color/gray/light/2", value: "#FDF8F6", swatch: "var(--surface-light-2)" },
  { path: "surface/light/12", value: "#271D16", swatch: "var(--surface-light-12)" },
  { path: "font/family/sans", value: "Inter", swatch: null },
  { path: "spacing/4", value: "16px", swatch: null },
];

const CSS_OUTPUT = [
  ":root {",
  "  --primary: var(--color-brand-primary-500);",
  "  --background: var(--surface-light-2);",
  "  --foreground: var(--surface-light-12);",
  "  --border: var(--surface-light-4);",
  "  --muted-foreground: var(--surface-light-11);",
  "}",
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const reduced = useReducedMotion();

  usePageMeta({
    title: "Design Tokens That Actually Ship",
    description:
      "Cipher generates a production-ready token system inside Figma — primitives, aliases, semantics — and exports CSS your codebase can use today. Free & open source.",
    ogTitle: "Cipher — Design Tokens That Actually Ship",
    ogDescription:
      "Generate, export, and import a complete design token system between Figma and code. OKLCH colors, responsive typography, Tailwind v4 ready.",
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
      {/* =============================================================== */}
      {/* HERO — centered, confident                                      */}
      {/* =============================================================== */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] left-1/2 h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-[180px]" />
        </div>

        <Container padding="x">
          <div className="relative flex flex-col items-center pt-24 pb-8 text-center sm:pt-32 sm:pb-12 lg:pt-44 lg:pb-16">
            <FadeUp>
              <Badge size="default" variant="primaryMuted">
                Figma Plugin — Free & Open Source
              </Badge>
            </FadeUp>

            <FadeUp delay={0.05}>
              <h1 className="mt-6 max-w-4xl font-extrabold text-[clamp(2.75rem,7vw,5.5rem)] leading-[1.02] tracking-tight">
                Design tokens that{" "}
                <span className="text-primary">actually ship.</span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.1}>
              <p className="mt-6 max-w-xl text-muted-foreground text-xl leading-relaxed sm:text-2xl">
                Figma gives you variables — not a design system. Cipher
                generates the structure your code needs and exports production
                CSS out of the box.
              </p>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:mt-12">
                <RichButton size="lg">
                  Install from Figma
                  <ArrowRight className="size-4" />
                </RichButton>
                <Button asChild size="lg" variant="ghost">
                  <a
                    href="https://github.com/atom63/cipher"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View Source
                  </a>
                </Button>
              </div>
            </FadeUp>

            <FadeIn delay={0.3}>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-muted-foreground/60 text-sm tracking-wide sm:mt-14">
                <span>230+ tokens</span>
                <span className="text-border">·</span>
                <span>7 CSS files</span>
                <span className="text-border">·</span>
                <span>Tailwind v4 ready</span>
              </div>
            </FadeIn>
          </div>
        </Container>
      </section>

      {/* =============================================================== */}
      {/* CODE SHOWCASE — the proof                                       */}
      {/* =============================================================== */}
      <section>
        <Container maxWidth="narrow" padding="x">
          <FadeUp>
            <div className="overflow-hidden rounded-xl border border-border/60 shadow-(--shadow-5)">
              {/* File tabs */}
              <div className="flex items-center gap-0 overflow-x-auto border-border/50 border-b bg-card/80">
                {CSS_FILES.map((file) => (
                  <div
                    className={`shrink-0 border-border/30 border-r px-3.5 py-2 font-mono text-[11px] ${
                      file.active
                        ? "bg-background/80 text-foreground"
                        : "text-muted-foreground/50"
                    }`}
                    key={file.name}
                  >
                    {file.name}
                  </div>
                ))}
                <div className="flex-1" />
                <Badge
                  className="mr-3 shrink-0"
                  size="sm"
                  variant="orange"
                >
                  Cipher
                </Badge>
              </div>

              {/* Code lines */}
              <div className="bg-card/40 p-4 sm:p-5">
                {CODE_LINES.map((line, i) => (
                  <motion.div
                    className={`font-mono text-[12px] leading-6 sm:text-[13px] sm:leading-7 ${line.dim ? "opacity-40" : ""}`}
                    initial={reduced ? false : { opacity: 0, x: -8 }}
                    key={"text" in line ? `t-${line.text}` : `v-${line.token}`}
                    transition={{
                      duration: 0.4,
                      delay: 0.3 + i * 0.035,
                      ease,
                    }}
                    viewport={{ once: true }}
                    whileInView={{ opacity: line.dim ? 0.4 : 1, x: 0 }}
                  >
                    {"text" in line ? (
                      <span className="text-foreground/70">
                        {"  ".repeat(line.indent)}
                        {line.text}
                      </span>
                    ) : (
                      <span>
                        {"  ".repeat(line.indent)}
                        <span className="text-primary/80">{line.token}</span>
                        <span className="text-foreground/30">: </span>
                        <span className="text-foreground/60">{line.value}</span>
                        <span className="text-foreground/30">;</span>
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* =============================================================== */}
      {/* WORKFLOW — three cards                                           */}
      {/* =============================================================== */}
      <section>
        <Container maxWidth="default" padding="all">
          <Section gap={false} removeTopSpacing={false} spacing="generous">
            <FadeUp>
              <p className="font-semibold text-primary text-sm uppercase tracking-widest">
                How it works
              </p>
              <h2 className="mt-3 max-w-md font-bold text-[clamp(1.75rem,3.5vw,3rem)] leading-[1.1] tracking-tight">
                Three steps. Zero config files.
              </h2>
            </FadeUp>

            <div className="mt-10 grid gap-5 sm:mt-14 md:grid-cols-3 md:gap-6">
              {WORKFLOW.map((step, i) => (
                <FadeUp delay={i * 0.08} key={step.title}>
                  <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card/40">
                    {/* Card title bar */}
                    <div className="flex items-center gap-2 border-border/40 border-b px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-border/80" />
                        <div className="size-2 rounded-full bg-border/80" />
                        <div className="size-2 rounded-full bg-border/80" />
                      </div>
                      <span className="ml-1 font-mono text-[10px] text-muted-foreground/50">
                        Cipher — {step.title}
                      </span>
                    </div>

                    {/* Visual */}
                    <div aria-hidden="true">
                      <step.Visual />
                    </div>

                    {/* Description */}
                    <div className="mt-auto border-border/30 border-t p-4">
                      <h3 className="font-bold text-base text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </Section>
        </Container>
      </section>

      {/* =============================================================== */}
      {/* FEATURES — compact grid                                         */}
      {/* =============================================================== */}
      <section className="border-border/40 border-y bg-card/30">
        <Container maxWidth="default" padding="all">
          <Section gap={false} removeTopSpacing={false} spacing="generous">
            <FadeUp>
              <p className="font-semibold text-primary text-sm uppercase tracking-widest">
                Why Cipher
              </p>
              <h2 className="mt-3 max-w-sm font-bold text-[clamp(1.75rem,3.5vw,3rem)] leading-[1.1] tracking-tight">
                Not another variable exporter.
              </h2>
            </FadeUp>

            <div className="mt-10 grid gap-x-10 gap-y-8 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-14">
              {FEATURES.map((f, i) => (
                <FadeUp delay={i * 0.04} key={f.title}>
                  <div className="flex gap-3.5">
                    <f.icon className="mt-0.5 size-5 shrink-0 text-primary/70" />
                    <div>
                      <h3 className="font-semibold text-base text-foreground">
                        {f.title}
                      </h3>
                      <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                        {f.description}
                      </p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </Section>
        </Container>
      </section>

      {/* =============================================================== */}
      {/* OUTPUT PREVIEW — Figma vars → production CSS                     */}
      {/* =============================================================== */}
      <section>
        <Container maxWidth="default" padding="all">
          <Section gap={false} removeTopSpacing={false} spacing="default">
            <FadeUp>
              <p className="font-semibold text-primary text-sm uppercase tracking-widest">
                Output
              </p>
              <h2 className="mt-3 font-bold text-[clamp(1.75rem,3.5vw,3rem)] leading-[1.1] tracking-tight">
                Figma variables in. Production CSS out.
              </h2>
            </FadeUp>

            <FadeUp delay={0.1}>
              <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border/50 bg-border/30 shadow-(--shadow-3) sm:mt-8 md:grid-cols-2">
                {/* Left — Figma variables */}
                <div className="bg-card/60 p-4 sm:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex size-5 items-center justify-center rounded bg-foreground/10">
                      <Layers className="size-3 text-foreground/60" />
                    </div>
                    <span className="font-mono font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                      Figma Variables
                    </span>
                  </div>
                  <div className="space-y-1">
                    {FIGMA_VARS.map((v, i) => (
                      <motion.div
                        className="flex items-center justify-between rounded-md border border-border/20 bg-background/40 px-2.5 py-1.5"
                        initial={reduced ? false : { opacity: 0, x: -6 }}
                        key={v.path}
                        transition={{
                          duration: 0.4,
                          delay: 0.25 + i * 0.04,
                          ease,
                        }}
                        viewport={{ once: true }}
                        whileInView={{ opacity: 1, x: 0 }}
                      >
                        <span className="font-mono text-[11px] text-foreground/70">
                          {v.path}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {v.swatch && (
                            <span
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: v.swatch }}
                            />
                          )}
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {v.value}
                          </span>
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Right — CSS output */}
                <div className="bg-card/40 p-4 sm:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex size-5 items-center justify-center rounded bg-primary/10">
                      <Code className="size-3 text-primary/70" />
                    </div>
                    <span className="font-mono font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                      semantics.css
                    </span>
                  </div>
                  <div className="rounded-md border border-border/20 bg-background/40 p-3">
                    {CSS_OUTPUT.map((line, i) => (
                      <motion.div
                        className="font-mono text-[11px] leading-5 sm:text-[12px] sm:leading-6"
                        initial={reduced ? false : { opacity: 0, x: -6 }}
                        key={line || `empty-${i}`}
                        transition={{
                          duration: 0.4,
                          delay: 0.3 + i * 0.04,
                          ease,
                        }}
                        viewport={{ once: true }}
                        whileInView={{ opacity: 1, x: 0 }}
                      >
                        {line.startsWith("  ") ? (
                          <span>
                            <span className="text-muted-foreground/60">
                              {"  "}
                            </span>
                            <span className="text-primary/80">
                              {line.trim().split(":")[0]}
                            </span>
                            <span className="text-foreground/30">: </span>
                            <span className="text-foreground/60">
                              {line.trim().split(": ").slice(1).join(": ")}
                            </span>
                          </span>
                        ) : (
                          <span className="text-foreground/50">{line}</span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeUp>
          </Section>
        </Container>
      </section>

      {/* =============================================================== */}
      {/* CLOSE — trust + CTA combined                                    */}
      {/* =============================================================== */}
      <section className="border-border/40 border-t bg-card/30">
        <Container maxWidth="default" padding="all">
          <Section
            className="flex flex-col items-center text-center"
            removeTopSpacing={false}
            spacing="spacious"
          >
            <FadeUp>
              <Lock className="size-6 text-primary/70" />
              <p className="mt-3 max-w-md text-muted-foreground text-sm leading-relaxed">
                Runs entirely inside Figma — no servers, no analytics, no data
                leaves your file. MIT licensed, open source, every operation
                is undoable.
              </p>
            </FadeUp>

            <FadeUp delay={0.06}>
              <h2 className="mt-10 max-w-xl text-balance font-extrabold text-[clamp(1.75rem,5vw,4rem)] leading-[1.04] tracking-tight sm:mt-14">
                Stop hand-wiring tokens.{" "}
                <span className="text-primary">Start shipping.</span>
              </h2>
            </FadeUp>

            <FadeUp delay={0.1}>
              <div className="mt-8 sm:mt-10">
                <RichButton size="lg">
                  Install Cipher from Figma
                  <ArrowRight className="size-4" />
                </RichButton>
              </div>
            </FadeUp>

            <FadeIn delay={0.2}>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
                <a
                  className="relative rounded-sm px-2 py-2 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href="https://github.com/atom63/cipher"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  GitHub
                </a>
                <span aria-hidden="true" className="text-border">
                  ·
                </span>
                <span className="px-2 py-2">MIT License</span>
                <span aria-hidden="true" className="text-border">
                  ·
                </span>
                <a
                  className="relative rounded-sm px-2 py-2 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href="mailto:hello@atom63.com"
                >
                  Contact
                </a>
              </div>
            </FadeIn>
          </Section>
        </Container>
      </section>
    </DefaultLayout>
  );
}
