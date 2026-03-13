# Cipher — AI Guidelines

## Design Context

### Users
**Primary**: Designers managing design system tokens inside Figma. They expect the plugin to feel like a natural extension of Figma — fast, visually clear, and trustworthy. The primary job is creating, previewing, and syncing token systems without leaving their design workflow.

**Secondary**: Developers who consume the exported CSS custom properties, Tailwind themes, and JSON tokens. They care about clean output, easy integration, and trustworthy tooling.

**Website audience**: Both designers and developers evaluating whether Cipher fits their workflow. They need to understand the value proposition quickly and see the quality of the output.

### Emotional Goals
The website should evoke **quiet confidence** and **craft & precision**. Visitors should feel: "Someone who cares deeply about quality built this" and "It doesn't try to impress me — it just is impressive." The interface earns trust through restraint and intentionality, not through spectacle.

### Brand Personality
**Precise. Professional. Confident.**
Cipher should feel like a sharp tool, not a toy. Restrained use of color, strong typographic hierarchy, no unnecessary decoration. Every pixel earns its place. The brand has a quiet confidence — it doesn't need to shout. Opinionated is a strength, never a disclaimer.

### Brand Color
**Orange (#F76B15)** is the unified brand primary across both the plugin and website. Use it consistently as the primary accent for interactive states, CTAs, and brand moments. Do not use blue as a primary — reserve it for informational/semantic contexts only.

### Aesthetic Direction

#### Plugin (in-product)
- **Reference**: Linear — keyboard-first, fast, minimal chrome, strong information hierarchy
- **Anti-reference**: Overly colorful dashboards, cluttered settings panels, anything that feels like a marketing page inside a tool
- **Visual tone**: Monochromatic surfaces with brand color used sparingly for emphasis and interactive states
- **Behavior**: Quiet until needed — default states are subdued, color appears on interaction and for status

#### Website (marketing/landing)
- **Reference**: Linear (linear.app) — minimal chrome, fast feel, strong information hierarchy, keyboard-first energy. Specifically: the way Linear presents product UI with confident restraint, editorial typography, and lets functionality speak.
- **Anti-reference**: Generic SaaS landing pages, AI-generated gradient slop, templated hero sections, overly playful/chaotic layouts, cyberpunk aesthetics, hacker clichés
- **Visual tone**: Confident and direct. Let the product speak with real screenshots and output previews, not abstract illustrations. Every element should feel deliberate, architectural, and earned.
- **Theme**: Dark mode is the default and hero experience. Light mode must feel equally intentional — full parity, both modes tested and polished. Designers will use both.

### Design Principles
1. **Quiet confidence** — The interface earns trust through restraint and craft, not volume. Understated authority over flashy marketing.
2. **Density over decoration** — Show useful information, not visual filler. In the plugin: compact layouts for the constrained Figma viewport. On the website: substance over padding.
3. **Hierarchy through typography** — Use font weight, size, and color (not borders or backgrounds) as the primary way to establish visual hierarchy. The type system (Inter, PT Serif, Geist Mono) carries the structure.
4. **Consistent token usage** — All components must use semantic CSS variables (`--background`, `--foreground`, `--primary`, `--border`, etc.). Never use hardcoded colors. The website eats its own dog food — it runs on Cipher's token output.
5. **Full dark/light parity** — Every component, state, and transition must look intentional in both light and dark modes. Neither is an afterthought. Test both.

### Accessibility
Pragmatic best effort: good contrast ratios, `prefers-reduced-motion` support, semantic HTML, `focus-visible` rings, status icons paired with text. Don't over-engineer it, but do the fundamentals well.

### Typography System
- **Sans (primary)**: Inter — optical sizing 14–32, variable weight 100–900, italic support
- **Serif (secondary)**: PT Serif — 400/700 weight, italic support
- **Mono (tertiary)**: Geist Mono — variable weight 100–900
- **Responsive scales**: 13 sizes (xs–9xl) that step up across sm/md breakpoints via `@media` and `[data-window-size]` attribute for container-aware scaling
- **Base size**: 14px/21px (--typography-base)

### Color Architecture
- **232 primitives**: Brand primary/secondary (50–950), danger/success/warning/info (50–950), gray light/dark (1–12), black/white alpha ramps (0–100%)
- **32 aliases**: Surface light/dark mappings, duration aliases (instant→slower), font family aliases (primary→sans)
- **37 semantics**: background, foreground, card, primary, secondary, muted, accent, border, input, ring, destructive, success, warning, info, chart colors, sidebar tokens
- **Light mode**: background=surface-light-2, foreground=surface-light-12, border=surface-light-4
- **Dark mode**: background=surface-dark-1, foreground=surface-dark-12, border=surface-dark-6

### Spacing & Layout
- **Base unit**: 4px (`--spacing-1`)
- **Scale**: 0, 0.5(2px), 1(4px), 1.5(6px), 2(8px)... up to 96(384px)
- **Radius anchor**: 10px (`--corner-radius`) with multiplier, scales from 2xs to full(9999px)
- **Shadows**: 7 levels (shadow-0 through shadow-6), elevation-based with increasing blur/spread
- **Blurs**: 7 levels (xs=4px through 3xl=64px)
- **Z-index**: default(0), base(10), header(50), dropdown(100), overlay(500), modal(900), toast(999)

### Motion & Animation
- **Framer Motion** for component animations: hover scale/rotate, tap feedback, page transitions (0.5s blur fade-in)
- **CSS keyframes**: accordion collapse/expand (0.2s ease-out), shimmer loaders, marquee, orbit, shiny-text, indeterminate progress
- **Easing tokens**: linear, fast(0,0,0,1), point-to-point(0.55,0.55,0,1), spring(0.13,1.62,0,0.92), soft(1,0,1,1), inout(0.63,0.05,0.01,0.99)
- **Duration tokens**: instant(0ms), fast(150ms), normal(250ms), slow(500ms), slower(1000ms)
- **Reduced motion**: Framer Motion animations respect `useReducedMotion()` hook throughout

### Website Content Direction (from brand strategy)
- **Core story**: Great interfaces depend on systems beneath the surface. Cipher helps teams decode and align that hidden structure so design tokens stay clear, consistent, and connected.
- **Creative north star**: Make hidden structure readable.
- **Homepage priorities**: (1) What Cipher is, (2) Why token structure becomes fragmented, (3) Why an opinionated system reduces friction, (4) How Cipher brings token workflows into sync, (5) What the product experience feels like.
- **Recommended opening**: "A highly opinionated token system for Figma" with a short paragraph explaining import, export, sync, and manage through a clearer, more structured workflow.
- **Language to favor**: opinionated, readable, structure, sync, system, logic, translate, map, align, source of truth, consistency, clarity, workflow.
- **Language to avoid**: magic, revolutionary, genius, futuristic, disruption, next-gen, hacker, secret weapon, fully automated, unlimited flexibility.
- **Visual qualities**: minimal, geometric, architectural, systematic, layered, balanced, refined, deliberate. Avoid noisy glitch effects, cybersecurity clichés, generic AI sparkles, visual chaos.

### Terminology Standards
Use these terms consistently across website, plugin listing, and docs:
- **token** = design token data (import/export context)
- **variable** = Figma variable (in-product management context)
- **collection** = Figma variable collection
- **mode** = value mode within a collection (e.g. Light and Dark)
- **synchronize** = preferred long form in strategy copy; **sync** = acceptable short form in UI labels and tight marketing surfaces

### Claim Safety
Strong claims Cipher can make:
- Helps import, export, and sync design tokens more clearly
- Built for structured token workflows
- Reduces manual overhead in managing system logic
- Helps maintain consistency between design and code
- Makes token systems easier to read and maintain

Claims to avoid (not implemented or not provable):
- Works for every team and every workflow
- Real-time team collaboration (not a plugin feature)
- Cloud sync/history (no remote backend)
- AI token generation (not implemented)
- Automatic WCAG compliance guarantees
- Zero-conflict imports (conflicts exist; plugin provides handling)

## Component Conventions (Plugin)

### Patterns
- **CSS Modules** for component-scoped styles (`Component.module.css`)
- **Semantic CSS vars** from the token system — never raw hex/rgb values
- **shadcn-style composition** for compound components (Card → CardHeader, CardTitle, CardContent, CardFooter)
- **`forwardRef`** on all interactive elements (Button, Input, Textarea)
- **Variants via props** mapped to CSS module classes, not inline styles
- **Lucide icons** at size 14-16px for UI, 18px for navigation

### Component API Guidelines
- Use `variant` for visual style (default, primary, ghost, destructive, outline)
- Use `size` for t-shirt sizes (sm, md, lg)
- Boolean props for states: `loading`, `disabled`, `selected`, `hover`
- Always include `className` pass-through for composition
- Always set `type="button"` on non-submit buttons

### Accessibility
- `aria-invalid` on inputs with errors
- `aria-describedby` linking inputs to their error/hint text
- `role="button"` + `tabIndex={0}` + keyboard handlers on clickable non-button elements
- `focus-visible` ring using `--ring` token (not `:focus`)
- Status icons paired with text (never color-only indicators)

## Component Conventions (Website)

### Patterns
- **Tailwind CSS v4** with utility classes — no CSS Modules
- **shadcn/ui + Radix + Base UI** for component primitives
- **CVA (class-variance-authority)** for variant definitions
- **Framer Motion** for animations (hover, tap, page transitions)
- **Lucide icons** for UI, Solar Icons for decorative

### Stack
- React 19 + TypeScript (strict)
- Vite 7 for bundling
- TanStack Router (file-based routing)
- TanStack React Query
- Tailwind CSS v4
- MDX for content pages
- Biome (via Ultracite) for formatting/linting

## Tech Stack (Plugin)
- React 18 + TypeScript (strict)
- esbuild for bundling
- CSS Modules (`.module.css`)
- Lucide React for icons
- Vitest for testing
- Biome (via Ultracite) for formatting/linting
- pnpm for package management

## Project Structure
```
plugin/
  src/
    code.ts              → Plugin sandbox entry (Figma main thread)
    ui.tsx               → React UI entry
    ui.scss              → Global styles / design tokens
    components/ui/       → Reusable UI primitives (Button, Card, Input, etc.)
    components/import/   → Import workflow components
    components/layout/   → Sidebar, page chrome
    components/library/  → Color library selectors (Radix, Tailwind)
    pages/               → Top-level page components
    handlers/            → CSS generation, export, import handlers
    parsers/             → Token/CSS parsing utilities
    generators/          → Design system token generator engine
    libraries/           → Color converters, variable binding, rebind matching
    hooks/               → Custom React hooks
    types/               → Shared TypeScript types
    utils/               → Debug utilities
  __tests__/             → Vitest test files
  assets/                → Plugin icon and cover image
  exports/styles/        → Reference CSS token files (source of truth)
  docs/                  → Architecture, PRD, publishing, legal docs
  dist/                  → Build output (gitignored)

website/
  src/
    components/ui/       → shadcn/ui primitives (Button, Badge, etc.)
    components/common/   → Layout, theme, icons, MDX, custom components
    config/              → Site metadata, socials
    contexts/            → Theme, password gate providers
    hooks/               → Custom React hooks
    pages/               → Page components
    routes/              → TanStack Router file-based routes
    styles/              → Tailwind config, design tokens, utilities
    content/             → MDX content files
  public/                → Static assets, favicons, OG images
```
