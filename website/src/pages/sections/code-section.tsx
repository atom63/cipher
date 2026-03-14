import { useState } from "react";
import { Github } from "lucide-react";
import { motion } from "motion/react";
import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import { Badge } from "@/components/ui/badge";
import { RichButton } from "@/components/common/custom/rich-button";
import { FadeUp, ease } from "./animation";

// ---------------------------------------------------------------------------
// Token snippets
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
// Section
// ---------------------------------------------------------------------------

export function CodeSection({ reduced }: { reduced: boolean }) {
  const [activeFile, setActiveFile] = useState("primitives");
  // biome-ignore lint: activeFile always matches a snippet
  const active = TOKEN_SNIPPETS.find((s) => s.id === activeFile)!;

  return (
    <Section
      id="system-in-code"
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

                      if (trimmed.startsWith("/*") || trimmed.startsWith("*")) {
                        return (
                          <div key={`${activeFile}-${i}`} className="text-muted-foreground/50">
                            {spaces}{trimmed}
                          </div>
                        );
                      }

                      if (!trimmed) {
                        return <div key={`${activeFile}-${i}`}>{"\u00A0"}</div>;
                      }

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

                      if (trimmed.startsWith("@") || trimmed.startsWith(":root") || trimmed.startsWith(".dark")) {
                        return (
                          <div key={`${activeFile}-${i}`} className="text-foreground/70">
                            {spaces}{trimmed}
                          </div>
                        );
                      }

                      return (
                        <div key={`${activeFile}-${i}`} className="text-foreground/50">
                          {spaces}{trimmed}
                        </div>
                      );
                    })}
                  </code>
                </motion.pre>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-card/90 to-transparent" />
            </div>
          </div>
        </FadeUp>

        {/* Boilerplate CTA */}
        <FadeUp delay={0.2}>
          <div className="relative mt-12 overflow-hidden rounded-xl border border-primary/20 bg-primary/3 p-8 sm:p-10">
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
