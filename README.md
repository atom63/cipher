# Cipher

Design system token manager for Figma. Batch-manage variables and styles, generate token systems, and export production-ready CSS.

## What it does

### Variable Manager
Batch create, rename, move, duplicate, delete, and edit variable values across collections and modes. Scale numeric values, swap references between variables, check dependencies before deletion, and undo operations.

### Style Manager
Full CRUD for paint, text, effect, and grid styles with variable binding support. Scan styles for unbound properties and batch-bind them to matching variables with exact color match, path match, or name-based fallback strategies. Undo rebind operations.

### Token Import
Import design tokens from JSON or CSS files. Automatic conflict detection with two modes: **import** (skip conflicts) or **override** (update existing variables). Re-importing Cipher CSS exports auto-detects and sets override mode. Supports `color-mix()` opacity round-trip, `var()` reference resolution, and undo for all import operations.

### CSS Export
Export variables as production-ready CSS custom properties with:
- `color-mix(in srgb, var(--token), transparent N%)` for style-level opacity preservation
- Tailwind CSS v4 `@theme inline` blocks
- Color formats: OKLCH, HEX, RGBA, HSL
- Multi-file output: primitives, aliases, semantics, typescales, effects, radius
- ZIP download, individual file copy, and clipboard support

### JSON Export
Structured token format with variable names, values per mode, types, and collection metadata.

### Token Generator
Generate complete three-tier token systems (primitives → aliases → semantics) from:
- **Brand colors** — Primary + optional secondary, generates 50–950 color scales via OKLCH
- **Surface tones** — Light/dark gray scales from Radix presets (13 palettes) or custom hex
- **Status colors** — Danger, success, warning, info with full scale generation
- **Typography** — Configurable base size, line heights, scale ratio (12 presets from Minor Second to Octave), steps up/down, font family overrides
- **Spacing** — 4px base, power-of-2 scale up to 384px
- **Radius** — Anchor-based scale with multiplier (sm through full)
- **Shadows** — 7-level shadow scale with blur tokens
- **Utilities** — Z-layers, durations, easing curves

Auto-detects existing variables to pre-fill configuration for updates.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.0.0
- [pnpm](https://pnpm.io/)

### Setup

```bash
pnpm install
pnpm dev       # Watch mode
pnpm build     # Production build
```

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development mode with file watching |
| `pnpm build` | Build for production |
| `pnpm test` | Run tests |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | Lint with Ultracite (Biome) |
| `pnpm format` | Auto-fix formatting and lint issues |
| `pnpm check` | Run typecheck + lint + tests |

### Installing in Figma

1. Figma → Plugins → Development → Import plugin from manifest
2. Select `manifest.json` from this project root
3. Plugin appears under Plugins → Development → Cipher

## Project Structure

```
src/
  code.ts              # Figma main thread (sandbox)
  ui.tsx               # React UI entry point
  ui.scss              # Global styles / design tokens
  components/
    ui/                # Reusable primitives (Button, Card, Input, Dialog, etc.)
    import/            # Import workflow (file upload, token review, progress)
    layout/            # App header, sidebar, page layout
    library/           # Color library selectors (Radix, Tailwind)
    common/            # Shared components (icons)
  pages/               # Top-level pages (Manage, Import, Export, Generate, About)
  handlers/            # CSS generation, export, import logic
  generators/          # Token generation engine (three-tier, color scales, presets)
  parsers/             # Token and CSS parsers (JSON, CSS custom properties)
  libraries/           # Color converters, variable binding, rebind matching
  hooks/               # Custom React hooks
  types/               # TypeScript types and message protocol
  utils/               # Helpers (theme, zip, clipboard, debug)
__tests__/             # Test suite (416 tests)
assets/                # Plugin icon and cover image
exports/               # Reference CSS token samples
docs/                  # Architecture, PRD, publishing, legal
build.js               # esbuild configuration
```

## Tech Stack

- **React 18** + **TypeScript** (strict mode)
- **esbuild** with custom CSS Modules plugin
- **SCSS** + **CSS Modules** for component-scoped styling
- **Lucide React** for icons
- **Vitest** for testing (416 tests across 16 files)
- **Biome** (via Ultracite) for formatting and linting
- **pnpm** for package management

## Publishing

See [docs/PUBLISH.md](docs/PUBLISH.md) for Figma Community publishing instructions.

## License

MIT © You Zhang (ATOM63)
