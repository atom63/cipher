import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Github,
  Layers,
  Lock,
  Palette,
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
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from "@/components/ui/accordion";
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
          <span className="font-semibold text-xs text-foreground/70 uppercase tracking-wider">
            Brand Color
          </span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">
            #867DFF
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
          <span className="font-semibold text-xs text-foreground/70 uppercase tracking-wider">
            Surface Tone
          </span>
          <span className="text-xs text-muted-foreground">Neutral</span>
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
        <span className="text-xs text-foreground/80">
          Major Third — 1.250
        </span>
      </div>

      <div className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-medium text-xs text-primary-foreground">
        <Zap className="size-3" />
        Generate Token System
      </div>
    </div>
  );
}

function ManageVisual() {
  const actions = [
    { name: "Rename", count: 12 },
    { name: "Move", count: 8 },
    { name: "Delete", count: 3 },
  ];

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold text-xs text-foreground/70 uppercase tracking-wider">
          Batch Actions
        </span>
        <span className="text-xs text-muted-foreground">23 selected</span>
      </div>

      <div className="space-y-1">
        {actions.map((action) => (
          <div
            className="flex items-center justify-between rounded-md border border-border/30 bg-background/30 px-2.5 py-1.5"
            key={action.name}
          >
            <span className="font-mono text-xs text-foreground/70">
              {action.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {action.count} vars
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Rename", "Edit", "Move", "Duplicate", "Delete", "Batch"].map(
          (action) => (
            <span
              className="rounded-sm bg-foreground/5 px-2 py-0.5 font-mono text-xs text-foreground/50"
              key={action}
            >
              {action}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

function RoundTripVisual() {
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
        <span className="font-semibold text-xs text-foreground/70 uppercase tracking-wider">
          Import Review
        </span>
        <span className="text-xs text-muted-foreground">
          5 from semantics.css
        </span>
      </div>

      <div className="space-y-1">
        {tokens.map((token) => (
          <div
            className="flex items-center justify-between rounded-md border border-border/30 bg-background/30 px-2.5 py-1.5"
            key={token.name}
          >
            <span className="font-mono text-xs text-primary/80">
              {token.name}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 font-semibold text-xs uppercase tracking-wider ${
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
        <div className="flex flex-1 items-center justify-center rounded-md border border-border/40 bg-background/50 py-1.5 text-xs text-muted-foreground">
          Cancel
        </div>
        <div className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary py-1.5 font-medium text-xs text-primary-foreground">
          <Upload className="size-3" />
          Import 4
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Code showcase — real snippets from token files
// ---------------------------------------------------------------------------

const TOKEN_SNIPPETS: { id: string; label: string; file: string; vars: number; code: string }[] = [
  {
    id: "primitives",
    label: "Primitives",
    file: "primitives.css",
    vars: 232,
    code: `/* primitives.css — 232 variables */

:root {
  --color-brand-primary-50:  rgba(249, 250, 255, 1);
  --color-brand-primary-100: rgba(240, 242, 255, 1);
  --color-brand-primary-200: rgba(225, 227, 255, 1);
  --color-brand-primary-300: rgba(207, 208, 255, 1);
  --color-brand-primary-400: rgba(186, 183, 255, 1);
  --color-brand-primary-500: rgba(134, 125, 255, 1);
  --color-brand-primary-600: rgba(101, 90, 209, 1);
  --color-brand-primary-700: rgba(67, 53, 155, 1);
  --color-brand-primary-800: rgba(41, 25, 108, 1);
  --color-brand-primary-900: rgba(17, 2, 61, 1);
  --color-brand-primary-950: rgba(4, 0, 27, 1);

  --color-brand-secondary-500: rgba(241, 114, 0, 1);

  --spacing-4: 16px;
  --spacing-8: 32px;
  --spacing-16: 64px;

  --font-family-sans: "Inter", ui-sans-serif, system-ui;
  --font-family-mono: "Geist Mono", ui-monospace;

  --duration-167: 167ms;
  --duration-250: 250ms;
  --ease-fast: cubic-bezier(0, 0, 0, 1);
}`,
  },
  {
    id: "aliases",
    label: "Aliases",
    file: "aliases.css",
    vars: 32,
    code: `/* aliases.css — 32 variables */

:root {
  --surface-light-1:  var(--color-gray-light-1);
  --surface-light-2:  var(--color-gray-light-2);
  --surface-light-3:  var(--color-gray-light-3);
  --surface-light-12: var(--color-gray-light-12);

  --surface-dark-1:  var(--color-gray-dark-1);
  --surface-dark-2:  var(--color-gray-dark-2);
  --surface-dark-3:  var(--color-gray-dark-3);
  --surface-dark-12: var(--color-gray-dark-12);

  --duration-fast:   var(--duration-150);
  --duration-normal: var(--duration-250);
  --duration-slow:   var(--duration-500);

  --font-family-primary:   var(--font-family-sans);
  --font-family-secondary: var(--font-family-serif);
  --font-family-tertiary:  var(--font-family-mono);
}`,
  },
  {
    id: "semantics",
    label: "Semantics",
    file: "semantics.css",
    vars: 37,
    code: `/* semantics.css — 37 variables */

:root {
  --background:       var(--surface-light-2);
  --foreground:       var(--surface-light-12);
  --primary:          var(--color-brand-primary-500);
  --primary-foreground: var(--surface-light-1);
  --muted:            var(--surface-light-3);
  --muted-foreground: var(--surface-light-11);
  --border:           var(--surface-light-4);
  --destructive:      var(--color-danger-500);
  --success:          var(--color-success-500);
}

.dark {
  --background:       var(--surface-dark-1);
  --foreground:       var(--surface-dark-12);
  --primary:          var(--color-brand-secondary-500);
  --primary-foreground: var(--surface-dark-12);
  --border:           var(--surface-dark-6);
}`,
  },
  {
    id: "typescales",
    label: "Type Scale",
    file: "typescales.css",
    vars: 18,
    code: `/* typescales.css — responsive typography */

:root {
  --typography-base-font-size: calc(14px * var(--scale, 1));
  --typography-lg-font-size:   calc(16px * var(--scale, 1));
  --typography-xl-font-size:   calc(18px * var(--scale, 1));
  --typography-2xl-font-size:  calc(21px * var(--scale, 1));
  --typography-3xl-font-size:  calc(25px * var(--scale, 1));
  --typography-4xl-font-size:  calc(29px * var(--scale, 1));
  --typography-5xl-font-size:  calc(34px * var(--scale, 1));
}

/* 768px+ — tablet landscape */
@media (min-width: 48rem) {
  :root {
    --typography-3xl-font-size: calc(29px * var(--scale, 1));
    --typography-5xl-font-size: calc(42px * var(--scale, 1));
    --typography-7xl-font-size: calc(60px * var(--scale, 1));
    --typography-9xl-font-size: calc(87px * var(--scale, 1));
  }
}`,
  },
  {
    id: "effects",
    label: "Effects",
    file: "effects.css",
    vars: 14,
    code: `/* effects.css — shadows & blurs */

:root {
  --shadow-0: 0px 0px 0px 0px rgba(0, 0, 0, 0);
  --shadow-1: 0px 1px 2px 0px rgba(0, 0, 0, 0.05),
              0px 1px 3px 0px rgba(0, 0, 0, 0.1);
  --shadow-3: 0px 4px 6px -2px rgba(0, 0, 0, 0.05),
              0px 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-5: 0px 10px 15px -3px rgba(0, 0, 0, 0.04),
              0px 25px 50px -12px rgba(0, 0, 0, 0.1);

  --blur-sm: 8px;
  --blur-md: 12px;
  --blur-lg: 16px;
  --blur-xl: 24px;
  --blur-2xl: 40px;
}`,
  },
];

// ---------------------------------------------------------------------------
// Code showcase section (interactive)
// ---------------------------------------------------------------------------

function CodeShowcase({ reduced }: { reduced: boolean }) {
  const [activeFile, setActiveFile] = useState("primitives");
  // biome-ignore lint: activeFile always matches a snippet
  const active = TOKEN_SNIPPETS.find((s) => s.id === activeFile)!;

  return (
    <Section
      id="system-in-code"
      className="border-y border-border/40 bg-card/30"
      gap={false}
      removeTopSpacing={false}
      spacing="generous"
    >
      <Container maxWidth="narrow" padding="all">
        <FadeUp>
          <p className="font-semibold text-sm uppercase tracking-widest text-primary">
            Output
          </p>
          <h2 className="mt-3 font-bold text-4xl leading-tight tracking-tight">
            See the system in code
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Preview how Cipher tokens map into a real codebase. Inspect token
            structure, explore output, and use the open-source website starter
            as a reference or boilerplate for faster builds.
          </p>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="mt-8 overflow-hidden rounded-xl border border-border/60 shadow-5">
            {/* Interactive file tabs */}
            <div className="flex items-center gap-0 overflow-x-auto border-b border-border/50 bg-card/80">
              {TOKEN_SNIPPETS.map((snippet) => (
                <button
                  className={`shrink-0 border-r border-border/30 px-3.5 py-2 font-mono text-xs transition-colors ${
                    snippet.id === activeFile
                      ? "bg-background/80 text-foreground"
                      : "text-muted-foreground/50 hover:text-muted-foreground"
                  }`}
                  key={snippet.id}
                  onClick={() => setActiveFile(snippet.id)}
                  type="button"
                >
                  {snippet.file}
                </button>
              ))}
              <div className="flex-1" />
              <span className="mr-3 shrink-0 font-mono text-xs text-muted-foreground/40">
                {active.vars} vars
              </span>
            </div>

            {/* Code content — fixed height with bottom fade */}
            <div className="relative bg-card/40">
              <div className="h-[340px] overflow-hidden p-4 sm:p-5">
                <motion.pre
                  key={activeFile}
                  className="overflow-x-auto font-mono text-sm leading-relaxed"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease }}
                >
                  <code>
                    {active.code.split("\n").map((line, i) => {
                    const trimmed = line.trimStart();
                    const indent = line.length - trimmed.length;
                    const spaces = " ".repeat(indent);

                    // Comment lines
                    if (trimmed.startsWith("/*") || trimmed.startsWith("*")) {
                      return (
                        <div key={`${activeFile}-${i}`} className="text-muted-foreground/50">
                          {spaces}{trimmed}
                        </div>
                      );
                    }

                    // Empty lines
                    if (!trimmed) {
                      return <div key={`${activeFile}-${i}`}>{"\u00A0"}</div>;
                    }

                    // CSS property lines (contains : and ;)
                    if (trimmed.includes(":") && trimmed.includes(";")) {
                      const colonIdx = trimmed.indexOf(":");
                      const prop = trimmed.slice(0, colonIdx);
                      const val = trimmed.slice(colonIdx);
                      return (
                        <div key={`${activeFile}-${i}`}>
                          {spaces}
                          <span className="text-primary/80">{prop}</span>
                          <span className="text-foreground/30">{val.slice(0, 2)}</span>
                          <span className="text-foreground/60">{val.slice(2)}</span>
                        </div>
                      );
                    }

                    // Selectors, @rules, brackets
                    if (trimmed.startsWith("@") || trimmed.startsWith(":root") || trimmed.startsWith(".dark")) {
                      return (
                        <div key={`${activeFile}-${i}`} className="text-foreground/70">
                          {spaces}{trimmed}
                        </div>
                      );
                    }

                    // Everything else (closing brackets, etc)
                    return (
                      <div key={`${activeFile}-${i}`} className="text-foreground/50">
                        {spaces}{trimmed}
                      </div>
                    );
                  })}
                  </code>
                </motion.pre>
              </div>
              {/* Bottom fade gradient */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-card/90 to-transparent" />
            </div>
          </div>
        </FadeUp>

        {/* Boilerplate CTA */}
        <FadeUp delay={0.2}>
          <div className="relative mt-12 overflow-hidden rounded-xl border border-primary/20 bg-primary/3 p-8 sm:p-10">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-primary/8 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-brand-secondary/6 blur-3xl" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Open Source
                </p>
                <h3 className="text-2xl font-bold tracking-tight">
                  Start building with Cipher tokens
                </h3>
                <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                  A public website starter that applies the full token structure
                  in code — use it as a reference implementation or boilerplate
                  for product sites, prototypes, and vibe-coded experiments.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2.5 sm:items-end">
                <a href="https://github.com/atom63/cipher" rel="noopener noreferrer" target="_blank">
                  <RichButton size="lg">
                    <Github className="size-4" />
                    View on GitHub
                  </RichButton>
                </a>
                <span className="text-xs text-muted-foreground/50">
                  MIT Licensed
                </span>
              </div>
            </div>
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const WORKFLOW = [
  {
    title: "Generate + Update",
    description:
      "Generate an opinionated token structure from a small set of brand and UI decisions, then come back anytime to preview, update, and regenerate.",
    Visual: GenerateVisual,
  },
  {
    title: "Manage",
    description:
      "Maintain your token system with comprehensive CRUD controls and batch actions for variables and styles at scale.",
    Visual: ManageVisual,
  },
  {
    title: "Round-trip",
    description:
      "Export structured token files for code workflows, make changes outside Figma, then import them back to keep everything aligned.",
    Visual: RoundTripVisual,
  },
];

const FEATURES = [
  {
    icon: Palette,
    title: "Ready for modern CSS workflows",
    description:
      "Token structure designed to plug into Tailwind CSS v4 and shadcn/ui-style setups.",
  },
  {
    icon: Layers,
    title: "Built with a point of view",
    description:
      "Not trying to support every workflow equally. A clearer structure that favors readability and consistency.",
  },
  {
    icon: Lock,
    title: "Free during beta, local by default",
    description:
      "Runs locally inside Figma without external servers or telemetry. Currently free to use.",
  },
];

const FAQ_ITEMS = [
  {
    q: 'What does "opinionated" mean?',
    a: "Cipher is built around a clear token structure and workflow philosophy. Instead of supporting every possible setup equally, it prioritizes readability, consistency, and maintainability.",
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
    q: "What can Cipher generate?",
    a: "Cipher can generate a structured token system from configurable inputs such as brand colors, surface colors, status colors, radius ramps, and type scale ramps.",
  },
  {
    q: "Can I update an existing Cipher-generated system?",
    a: "Yes. You can reopen the generation workflow, preview the current setup, change core values, and regenerate the system in Figma.",
  },
  {
    q: "What can Cipher manage?",
    a: "Cipher supports CRUD and batch actions for variables and styles, including rename, edit, move, duplicate, and delete.",
  },
  {
    q: "Can I export tokens for code and import them back?",
    a: "Yes. Cipher supports round-trip workflows by exporting structured token files and importing changes back into Figma.",
  },
  {
    q: "Does Cipher use cloud sync or external servers?",
    a: "No. Cipher is local-only and does not use external servers or telemetry.",
  },
  {
    q: "Who is Cipher for?",
    a: "Cipher is for designers and developers who care about readable token systems and stronger alignment between design and code.",
  },
  {
    q: "What is the open-source website starter?",
    a: "It is a public starter repo that applies Cipher's token structure in code, so you can explore the workflow or build on top of it outside the plugin UI.",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const reduced = useReducedMotion();

  usePageMeta({
    title: "A token system that aligns design and code",
    description:
      "Cipher is a local-first Figma plugin for generating, updating, managing, and round-tripping structured design tokens across design and implementation workflows.",
    ogTitle: "Cipher — A token system that aligns design and code",
    ogDescription:
      "Generate, update, manage, and round-trip structured tokens through an opinionated workflow. Free during beta, local-only, ready for modern CSS workflows.",
    keywords: [
      "design tokens",
      "figma plugin",
      "css variables",
      "design system",
      "tailwind css v4",
      "design to code",
      "token export",
      "shadcn ui",
    ],
  });

  return (
    <DefaultLayout noPadding>
      {/* =============================================================== */}
      {/* 1. HERO                                                         */}
      {/* =============================================================== */}
      <Section
        id="hero"
        className="relative overflow-hidden"
        gap={false}
        removeTopSpacing={false}
        spacing="spacious"
      >
        <Container maxWidth="narrow" padding="x">
          <div className="relative flex flex-col items-center text-center">
            <FadeUp>
              <div className="flex items-center justify-center gap-2.5">
                <Badge size="default" variant="primaryMuted">Beta</Badge>
                <span className="text-sm text-muted-foreground/60">·</span>
                <span className="text-sm text-muted-foreground/80">Free to use</span>
              </div>
            </FadeUp>

            <FadeUp delay={0.05}>
              <h1 className="mt-6 max-w-4xl font-extrabold text-8xl leading-none tracking-tight text-balance">
                A token system that aligns{" "}
                <span className="text-primary">design</span> and code
              </h1>
            </FadeUp>

            <FadeUp delay={0.1}>
              <p className="mx-auto mt-6 max-w-lg text-xl leading-relaxed text-muted-foreground">
                Cipher helps you generate, update, manage, and round-trip
                structured tokens through an opinionated workflow built to
                keep design decisions and code implementation aligned.
              </p>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
                <RichButton size="lg">
                  Install plugin
                  <ArrowRight className="size-4" />
                </RichButton>
                <Button asChild size="lg" variant="outline">
                  <a href="/docs">
                    <BookOpen className="size-4" />
                    View docs
                  </a>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <a
                    href="https://github.com/atom63/cipher"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View boilerplate
                  </a>
                </Button>
              </div>
            </FadeUp>

            <FadeIn delay={0.3}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs tracking-wide text-muted-foreground/60 uppercase">
                <span>Local-only</span>
                <span className="text-border">·</span>
                <span>No telemetry</span>
                <span className="text-border">·</span>
                <span>Ready for modern CSS workflows</span>
              </div>
            </FadeIn>
          </div>
        </Container>
      </Section>

      {/* =============================================================== */}
      {/* 2. FEATURES                                                     */}
      {/* =============================================================== */}
      <Section id="features" gap={false} removeTopSpacing={false} spacing="generous">
        <Container maxWidth="narrow"  padding="all">
          <FadeUp>
            <p className="font-semibold text-sm uppercase tracking-widest text-primary">
              Workflow
            </p>
            <h2 className="mt-3 max-w-lg font-bold text-4xl leading-tight tracking-tight">
              From raw variables to a usable system
            </h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Cipher helps you generate a structured token foundation, evolve it
              over time, manage variables and styles at scale, and keep design
              and code aligned through round-trip workflows.
            </p>
          </FadeUp>

          <div className="mt-10 grid gap-5 sm:mt-14 md:grid-cols-3 md:gap-6">
            {WORKFLOW.map((step, i) => (
              <FadeUp delay={i * 0.08} key={step.title}>
                <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card/40">
                  <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="size-2 rounded-full bg-border/80" />
                      <div className="size-2 rounded-full bg-border/80" />
                      <div className="size-2 rounded-full bg-border/80" />
                    </div>
                    <span className="ml-1 font-mono text-xs text-muted-foreground/50">
                      Cipher — {step.title}
                    </span>
                  </div>
                  <div aria-hidden="true">
                    <step.Visual />
                  </div>
                  <div className="mt-auto border-t border-border/30 p-4">
                    <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>

          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-14">
            {FEATURES.map((f, i) => (
              <FadeUp delay={i * 0.04} key={f.title}>
                <div className="flex gap-3.5">
                  <f.icon className="mt-0.5 size-5 shrink-0 text-primary/70" />
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {f.description}
                    </p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </Container>
      </Section>

      {/* =============================================================== */}
      {/* 3. SEE THE SYSTEM IN CODE                                       */}
      {/* =============================================================== */}
      <CodeShowcase reduced={reduced} />

      {/* =============================================================== */}
      {/* 4. FAQ                                                          */}
      {/* =============================================================== */}
      <Section id="faq" gap={false} removeTopSpacing={false} spacing="generous">
        <Container maxWidth="narrow" padding="all">
          <FadeUp>
            <div className="overflow-hidden rounded-xl border border-border/60 extrude-1">
              {/* Header */}
              <div className="border-b border-border/40 bg-card/80 px-6 py-5 sm:px-8 sm:py-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Questions
                </p>
                <h2 className="mt-2 font-bold text-3xl leading-tight tracking-tight">
                  FAQ
                </h2>
              </div>

              {/* Accordion inset */}
              <div className="mx-4 my-4 rounded-lg bg-background/60 px-4 sm:mx-6 sm:my-5 sm:px-6 intrude-1">
                <Accordion defaultValue={[0]}>
                  {FAQ_ITEMS.map((item, i) => (
                    <AccordionItem key={i} value={i}>
                      <AccordionTrigger className="text-base">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionPanel className="text-sm leading-relaxed">
                        {item.a}
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </FadeUp>
        </Container>
      </Section>

      {/* =============================================================== */}
      {/* 5. FOOTER CTA                                                   */}
      {/* =============================================================== */}
      <Section
        id="footer-cta"
        className="flex flex-col items-center border-t border-border/40 bg-card/30 text-center"
        removeTopSpacing={false}
        spacing="spacious"
      >
        <Container maxWidth="narrow"  padding="all">
          <FadeUp className="flex flex-col items-center">
            <h2 className="max-w-xl font-extrabold text-6xl leading-tight tracking-tight text-balance">
              Bring more structure to your design and code workflow
            </h2>
          </FadeUp>

          <FadeUp delay={0.06} className="flex flex-col items-center">
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Generate, update, manage, and round-trip tokens through a workflow
              built for readability, consistency, and real product use.
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
              <RichButton size="lg">
                Install plugin
                <ArrowRight className="size-4" />
              </RichButton>
              <Button asChild size="lg" variant="outline">
                <a href="/docs">
                  <BookOpen className="size-4" />
                  View docs
                </a>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <a href="https://github.com/atom63/cipher" rel="noopener noreferrer" target="_blank">
                  View boilerplate
                </a>
              </Button>
            </div>
          </FadeUp>

          <FadeIn delay={0.2}>
            <p className="mt-6 text-xs tracking-wide text-muted-foreground/50 uppercase">
              Free during beta
            </p>
          </FadeIn>
        </Container>
      </Section>
    </DefaultLayout>
  );
}
