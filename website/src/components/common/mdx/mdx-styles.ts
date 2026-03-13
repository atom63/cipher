/**
 * MDX STYLES - Consolidated style definitions
 * Extracted to separate file to avoid circular dependencies
 */

export const mdxStyles = {
  // wrapper you put around MDX content container (highly recommended)
  // Note: .not-mdx, .example-container, and .component-preview will opt-out of all typography styles
  root: [
    'mdx text-foreground',
    // .not-mdx resets
    '[&_.not-mdx:not(.example-container)]:!m-0',
    '[&_.not-mdx_p]:!m-0 [&_.not-mdx_a]:!no-underline',
    '[&_.not-mdx_h1]:!m-0 [&_.not-mdx_h2]:!m-0 [&_.not-mdx_h3]:!m-0',
    '[&_.not-mdx_h4]:!m-0 [&_.not-mdx_h5]:!m-0 [&_.not-mdx_h6]:!m-0',
    '[&_.not-mdx_ul]:!m-0 [&_.not-mdx_ol]:!m-0 [&_.not-mdx_li]:!m-0',
    // .example-container resets — `all:unset` resets inherited props (color,
    // font-size, line-height, font-weight) to `inherit` and non-inherited props
    // (margin, padding, display) to `initial`, so MDX-generated elements become
    // transparent and parent components control all styling.
    '[&_.example-container_p]:![all:unset] [&_.example-container_a]:![all:unset]',
    '[&_.example-container_h1]:![all:unset] [&_.example-container_h2]:![all:unset]',
    '[&_.example-container_h3]:![all:unset] [&_.example-container_h4]:![all:unset]',
    '[&_.example-container_h5]:![all:unset] [&_.example-container_h6]:![all:unset]',
    '[&_.example-container_ul]:![all:unset] [&_.example-container_ol]:![all:unset]',
    '[&_.example-container_li]:![all:unset] [&_.example-container_strong]:![all:unset]',
    '[&_.example-container_em]:![all:unset] [&_.example-container_blockquote]:![all:unset]',
  ].join(' '),

  spacing: {
    component: 'mt-6 first:mt-0', // Standard spacing for block components
    media: 'my-4 first:mt-0 last:mb-0', // Consistent spacing for all media blocks
  },

  headings: {
    h1: 'text-5xl font-semibold tracking-tight scroll-mt-24 mt-10 first:mt-0',
    h2: 'text-3xl font-semibold tracking-tight scroll-mt-24 mt-12 first:mt-0',
    h3: 'text-3xl font-semibold tracking-tight scroll-mt-24 mt-8 first:mt-0',
    h4: 'text-lg font-semibold tracking-tight scroll-mt-24 mt-6 first:mt-0',
    h5: 'text-base font-semibold scroll-mt-24 mt-6 first:mt-0',
    h6: 'text-base font-semibold text-secondary-foreground scroll-mt-24 mt-6 first:mt-0',
  },

  text: {
    paragraph:
      'text-base text-secondary-foreground !leading-[150%] mt-4 first:mt-0 last:mb-0 [&_a]:underline [&_a]:underline-offset-4',
    lead: 'text-lg text-secondary-foreground leading-7 mt-4 first:mt-0',
    small: 'text-base text-secondary-foreground leading-[145%]',
  },

  content: {
    // links
    link: 'font-medium underline underline-offset-4 decoration-2 decoration-input hover:text-primary hover:decoration-primary transition-colors',

    // emphasis
    strong: 'font-semibold text-foreground',
    em: 'italic',
    del: 'line-through text-secondary-foreground',
    ins: 'underline decoration-green-500/70',

    // inline code
    inlineCode:
      'rounded-xs bg-muted/50 px-1.5 py-0.5 font-mono text-xs leading-snug font-medium text-foreground ring-[0.5px] ring-inset ring-accent',

    // code blocks (pre)
    pre: 'mt-6 overflow-x-auto rounded-lg border border-border bg-card p-4 text-sm leading-[145%] [&_code]:bg-transparent [&_code]:p-0 [&_code]:border-0 [&_code]:ring-0 [&_code]:text-sm [&_code]:font-light [&_code]:leading-[145%]',
    code: 'font-mono text-sm leading-[145%]', // used inside <pre><code>

    // blockquote
    blockquote:
      'mt-6 border-l-4 border-border bg-muted/50 px-4 py-3 italic text-secondary-foreground rounded-r [&_p]:mt-2 [&_p:first-child]:mt-0',

    // lists
    ul: 'mt-4 mb-4 list-disc space-y-2 pl-4 [&_ul]:mt-2 [&_ul]:space-y-2 [&_ul]:pl-4',
    ol: 'mt-4 list-decimal space-y-2 pl-4 [&_ol]:mt-2 [&_ol]:space-y-2 [&_ol]:pl-4',
    li: 'text-base leading-7',

    // hr
    hr: 'my-10 border-t border-border',

    // kbd
    kbd: 'inline-flex h-6 select-none items-center gap-1 rounded-lg border border-border bg-muted px-2 font-mono text-xs font-medium text-secondary-foreground',

    // tables (wrap recommended)
    tableWrapper: 'mt-6 w-full overflow-x-auto rounded-lg border border-border bg-background',
    table: 'w-full border-collapse text-base',
    thead: 'bg-muted',
    tbody: '[&_tr:last-child]:border-0',
    tr: 'border-b border-border hover:bg-muted/40 transition-colors',
    th: 'h-11 px-4 text-left align-middle font-semibold text-foreground',
    td: 'px-4 py-3 align-middle text-foreground',
    caption: 'mt-3 text-xs text-secondary-foreground',

    // media
    img: 'rounded-lg',
    figure: 'my-8 first:mt-0 last:mb-0',
    figcaption: 'text-sm mt-3 text-center text-secondary-foreground leading-relaxed',
    iframe: 'w-full rounded-lg border border-border',
    video: 'w-full rounded-lg border border-border',
    audio: 'w-full',

    // details/summary
    details: 'mt-6 rounded-lg border border-border bg-card p-4',
    summary:
      'cursor-pointer select-none font-semibold text-foreground [&::-webkit-details-marker]:hidden',

    // misc semantics
    mark: 'rounded-lg bg-yellow-200 px-1 text-foreground dark:bg-yellow-800/60',
    sub: 'text-xs align-sub',
    sup: 'text-xs align-super',
    abbr: 'cursor-help border-b border-dotted border-secondary-foreground',
    cite: 'italic text-secondary-foreground',
    dfn: 'font-semibold',
    time: 'text-secondary-foreground',
    var: 'font-mono italic',
    samp: 'rounded-lg bg-muted px-1 font-mono text-xs',
    output: 'rounded-lg border border-border bg-muted px-2 py-1 font-mono text-xs',
  },

  layout: {
    callout: {
      base: 'mt-6 rounded-lg border p-4 [&_p]:mt-2 [&_p:first-child]:mt-0',
      info: 'border-blue-500/40 bg-blue-50/60 text-blue-950 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-50',
      warning:
        'border-yellow-500/40 bg-yellow-50/60 text-yellow-950 dark:border-yellow-500/40 dark:bg-yellow-950/40 dark:text-yellow-50',
      error:
        'border-red-500/40 bg-red-50/60 text-red-950 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-50',
      success:
        'border-green-500/40 bg-green-50/60 text-green-950 dark:border-green-500/40 dark:bg-green-950/40 dark:text-green-50',
    },
  },
} as const

export type CalloutType = 'info' | 'warning' | 'error' | 'success'
