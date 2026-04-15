import { motion } from 'motion/react'
import { useState } from 'react'
import Container from '@/components/common/layout/container'
import Section from '@/components/common/layout/section'
import { SectionHeader } from '@/components/common/layout/section-header'
import { ease, FadeUp } from './animation'

// ---------------------------------------------------------------------------
// Token snippets
// ---------------------------------------------------------------------------

const TOKEN_SNIPPETS: {
  id: string
  label: string
  file: string
  vars: number
  code: string
}[] = [
  {
    id: 'primitives',
    label: 'Primitives',
    file: 'primitives.css',
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
    id: 'aliases',
    label: 'Aliases',
    file: 'aliases.css',
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
    id: 'semantics',
    label: 'Semantics',
    file: 'semantics.css',
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
    id: 'typography',
    label: 'Typography',
    file: 'typography.css',
    vars: 18,
    code: `/* typography.css — font families, weights, and responsive typescales */

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
    id: 'effects',
    label: 'Effects',
    file: 'effects.css',
    vars: 14,
    code: `/* Effects — shadows and blurs */
/* Shadows override Tailwind defaults; names match shadow-* utilities */

@theme inline {
  --shadow-2xs: 0px 1px rgb(0 0 0 / 0.05);
  --shadow-md:
    0px 4px 6px -2px rgb(0 0 0 / 0.05),
    0px 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl:
    0px 10px 15px -3px rgb(0 0 0 / 0.04),
    0px 25px 50px -12px rgb(0 0 0 / 0.1);

  --blur-sm: 8px;
  --blur-md: 12px;
  --blur-lg: 16px;
  --blur-xl: 24px;
  --blur-2xl: 40px;
}`,
  },
]

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export function CodeSection({ reduced }: { reduced: boolean }) {
  const [activeFile, setActiveFile] = useState('primitives')
  // biome-ignore lint: activeFile always matches a snippet
  const active = TOKEN_SNIPPETS.find(s => s.id === activeFile)!

  return (
    <Section gap={false} id="system-in-code" removeTopSpacing={false} spacing="generous">
      <Container maxWidth="narrow" padding="all">
        <FadeUp>
          <SectionHeader
            align="center"
            description="Inspect the token structure Cipher generates — primitives, aliases, semantics, type scales, and effects."
            title="See the system in code"
            variant="muted"
          />
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="mt-8 overflow-hidden rounded-xl border border-border/60 shadow-xl">
            {/* Interactive file tabs */}
            <div className="flex items-center gap-0 overflow-x-auto border-border/50 border-b bg-card/80 backdrop-blur-xl">
              {TOKEN_SNIPPETS.map(snippet => (
                <button
                  className={`shrink-0 border-border/30 border-r px-3.5 py-2 font-mono text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                    snippet.id === activeFile
                      ? 'bg-background/80 text-foreground'
                      : 'text-muted-foreground/50 hover:text-muted-foreground'
                  }`}
                  key={snippet.id}
                  onClick={() => setActiveFile(snippet.id)}
                  type="button"
                >
                  {snippet.file}
                </button>
              ))}
              <div className="flex-1" />
              <span className="mx-3 shrink-0 font-mono text-muted-foreground/40 text-xs">
                {active.vars} vars
              </span>
            </div>

            {/* Code content — fixed height with bottom fade */}
            <div className="relative bg-card/40 backdrop-blur-xl">
              <div className="h-[340px] overflow-hidden p-4 sm:p-5">
                <motion.pre
                  animate={{ opacity: 1 }}
                  className="overflow-x-auto font-mono text-sm leading-relaxed"
                  initial={reduced ? false : { opacity: 0 }}
                  key={activeFile}
                  transition={{ duration: 0.3, ease }}
                >
                  <code>
                    {active.code.split('\n').map((line, i) => {
                      const trimmed = line.trimStart()
                      const indent = line.length - trimmed.length
                      const spaces = ' '.repeat(indent)

                      if (trimmed.startsWith('/*') || trimmed.startsWith('*')) {
                        return (
                          <div className="text-muted-foreground/50" key={`${activeFile}-${i}`}>
                            {spaces}
                            {trimmed}
                          </div>
                        )
                      }

                      if (!trimmed) {
                        return <div key={`${activeFile}-${i}`}>{'\u00A0'}</div>
                      }

                      if (
                        trimmed.includes(':') &&
                        (trimmed.includes(';') || trimmed.endsWith(','))
                      ) {
                        const colonIdx = trimmed.indexOf(':')
                        const prop = trimmed.slice(0, colonIdx)
                        const val = trimmed.slice(colonIdx)
                        return (
                          <div key={`${activeFile}-${i}`}>
                            {spaces}
                            <span className="text-primary/80">{prop}</span>
                            <span className="text-foreground/30">{val.slice(0, 2)}</span>
                            <span className="text-foreground/60">{val.slice(2)}</span>
                          </div>
                        )
                      }

                      if (
                        trimmed.startsWith('@') ||
                        trimmed.startsWith(':root') ||
                        trimmed.startsWith('.dark')
                      ) {
                        return (
                          <div className="text-foreground/70" key={`${activeFile}-${i}`}>
                            {spaces}
                            {trimmed}
                          </div>
                        )
                      }

                      return (
                        <div className="text-foreground/50" key={`${activeFile}-${i}`}>
                          {spaces}
                          {trimmed}
                        </div>
                      )
                    })}
                  </code>
                </motion.pre>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-card/90 to-transparent" />
            </div>
          </div>
        </FadeUp>
      </Container>
    </Section>
  )
}
