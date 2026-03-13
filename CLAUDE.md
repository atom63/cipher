# Cipher — AI Guidelines

## Design Context

### Users
**Primary**: Designers managing design system tokens inside Figma. They expect the plugin to feel like a natural extension of Figma — fast, visually clear, and trustworthy. The primary job is creating, previewing, and syncing token systems without leaving their design workflow.

**Secondary**: Developers who consume the exported CSS custom properties, Tailwind themes, and JSON tokens. They care about clean output, easy integration, and trustworthy tooling.

**Website audience**: Both designers and developers evaluating whether Cipher fits their workflow. They need to understand the value proposition quickly and see the quality of the output.

### Brand Personality
**Precise. Professional. Confident.**
Cipher should feel like a sharp tool, not a toy. Restrained use of color, strong typographic hierarchy, no unnecessary decoration. Every pixel earns its place.

### Brand Color
**Orange (#F76B15)** is the unified brand primary across both the plugin and website. Use it consistently as the primary accent for interactive states, CTAs, and brand moments. Do not use blue as a primary — reserve it for informational/semantic contexts only.

### Aesthetic Direction

#### Plugin (in-product)
- **Reference**: Linear — keyboard-first, fast, minimal chrome, strong information hierarchy
- **Anti-reference**: Overly colorful dashboards, cluttered settings panels, anything that feels like a marketing page inside a tool
- **Visual tone**: Monochromatic surfaces with brand color used sparingly for emphasis and interactive states
- **Behavior**: Quiet until needed — default states are subdued, color appears on interaction and for status

#### Website (marketing/landing)
- **Tone**: Bold and energetic — high-impact visuals, strong statements, standing out in the plugin marketplace
- **Theme**: Dark mode first — matches the designer/developer tool positioning. Light mode supported but dark is the hero experience.
- **Anti-reference**: Generic SaaS landing pages, AI-generated gradient slop, templated hero sections
- **Visual tone**: Confident and direct. Let the product speak with real screenshots and output previews, not abstract illustrations.

### Design Principles
1. **Density over decoration** — Show useful information, not visual filler. In the plugin: compact layouts for the constrained Figma viewport. On the website: substance over padding.
2. **Hierarchy through typography** — Use font weight, size, and color (not borders or backgrounds) as the primary way to establish visual hierarchy.
3. **Consistent token usage** — All components must use semantic CSS variables (`--background`, `--foreground`, `--primary`, `--border`, etc.). Never use hardcoded colors.
4. **Quiet until needed** — Default states are subdued. Color appears on interaction (hover, focus, active) and for status (success, warning, error). Idle UI is calm.
5. **Dark mode parity** — Every component, state, and transition must look intentional in both light and dark modes. Test both.

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
