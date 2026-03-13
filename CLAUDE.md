# Cipher — AI Guidelines

## Design Context

### Users
Designers managing design system tokens inside Figma. They expect the plugin to feel like a natural extension of Figma — fast, visually clear, and trustworthy. The primary job is creating, previewing, and syncing token systems without leaving their design workflow.

### Brand Personality
**Precise. Professional. Confident.**
Cipher should feel like a sharp tool, not a toy. Restrained use of color, strong typographic hierarchy, no unnecessary decoration. Every pixel earns its place.

### Aesthetic Direction
- **Reference**: Linear — keyboard-first, fast, minimal chrome, strong information hierarchy
- **Anti-reference**: Overly colorful dashboards, cluttered settings panels, anything that feels like a marketing page inside a tool
- **Theme**: Both light and dark, with dark mode treated as a first-class citizen (not an afterthought)
- **Visual tone**: Monochromatic surfaces with brand color used sparingly for emphasis and interactive states

### Design Principles
1. **Density over decoration** — Show useful information, not visual filler. Prefer compact layouts that respect the constrained Figma plugin viewport.
2. **Hierarchy through typography** — Use font weight, size, and color (not borders or backgrounds) as the primary way to establish visual hierarchy.
3. **Consistent token usage** — All components must use semantic CSS variables (`--background`, `--foreground`, `--primary`, `--border`, etc.). Never use hardcoded colors.
4. **Quiet until needed** — Default states are subdued. Color appears on interaction (hover, focus, active) and for status (success, warning, error). Idle UI is calm.
5. **Dark mode parity** — Every component, state, and transition must look intentional in both light and dark modes. Test both.

## Component Conventions

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

## Tech Stack
- React 18 + TypeScript (strict)
- esbuild for bundling
- CSS Modules (`.module.css`)
- Lucide React for icons
- Vitest for testing
- Biome (via Ultracite) for formatting/linting
- pnpm for package management

## Project Structure
```
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
```
