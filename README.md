# Cipher

Design system token manager for Figma. The fastest way to manage variables, styles, and get them into production CSS.

## What it does

- **Variable manager** — Batch create, rename, move, duplicate, delete, and edit values across collections and modes
- **Style manager** — Full CRUD for paint, text, effect, and grid styles with variable binding
- **Token import** — Import design tokens from JSON/CSS files with conflict resolution and undo
- **CSS export** — Export variables as production-ready CSS with `color-mix()` opacity, CSS custom properties, and Tailwind `@theme inline`
- **JSON export** — Bidirectional JSON support for pipeline integration
- **Token generator** — Generate complete token systems from Radix or Tailwind color libraries with typography scales, spacing, radius, and shadows
- **Style rebind** — Scan styles for unbound properties and batch-bind them to matching variables
- **Styleguide** — Live preview of your design system: color palettes, typography, spacing, radius, and shadows

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.0.0
- [pnpm](https://pnpm.io/)

### Setup

```bash
# Install dependencies
pnpm install

# Start development (watches for changes)
pnpm dev

# Build for production
pnpm build
```

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development mode with file watching |
| `pnpm build` | Build the plugin for production |
| `pnpm test` | Run tests |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | Lint with Ultracite (Biome) |
| `pnpm format` | Auto-fix formatting and lint issues |
| `pnpm check` | Run typecheck + lint + tests |
| `pnpm tokens` | Generate CSS from design tokens |

### Installing in Figma

1. Open Figma → Plugins → Development → Import plugin from manifest
2. Select the `manifest.json` file from this project
3. The plugin appears under Plugins → Development → Cipher

## Project Structure

```
cipher/
├── components/
│   ├── ui/           # Reusable primitives (Button, Card, Input, Dialog, etc.)
│   ├── import/       # Import workflow components
│   ├── layout/       # App header, sidebar
│   ├── library/      # Color library selectors (Radix, Tailwind)
│   ├── manage/       # Variable management components
│   └── common/       # Shared components (icons, animations)
├── pages/            # Top-level page components
│   ├── ManagePage    # Variable CRUD
│   ├── StylesPage    # Style CRUD + rebind
│   ├── ImportPage    # Token import
│   ├── ExportPage    # CSS/JSON export
│   ├── GeneratePage  # Token generator
│   ├── StyleguidePage # Design system preview
│   └── SettingsPage  # Plugin settings
├── handlers/         # Backend logic (import, export, CSS generation)
├── generators/       # Token generation engine
├── parsers/          # Token and CSS parsers
├── libraries/        # Shared utilities (color, variable binding, matching)
├── types/            # TypeScript types and message protocol
├── utils/            # Helpers (theme, zip, debug, errors)
├── exports/          # Generated CSS token files
├── __tests__/        # Test suite (374 tests)
├── code.ts           # Figma main thread (sandbox)
├── ui.tsx            # React UI entry point
└── build.js          # esbuild configuration
```

## Tech Stack

- **React 18** + **TypeScript** (strict mode)
- **esbuild** for bundling
- **SCSS** + **CSS Modules** for styling
- **Lucide React** for icons
- **Vitest** for testing
- **Ultracite** (Biome) for formatting and linting
- **pnpm** for package management

## Publishing

Before publishing to the Figma Community:

1. Register the plugin at [figma.com/plugin-docs](https://www.figma.com/plugin-docs/publishing/) to get a plugin ID
2. Replace `"your-plugin-id-here"` in `manifest.json` with your real ID
3. Prepare required assets:
   - **Plugin icon**: 128×128 PNG (displayed in Figma's plugin browser)
   - **Cover image**: 1920×960 PNG (displayed on Community page)
   - **Description**: See suggested copy below
4. Run `pnpm build` to produce the production bundle in `dist/`

### Suggested Community Description

> Cipher is a design system token manager that gives you batch control over Figma variables and styles — and exports them as production-ready CSS.
>
> **Manage variables at scale.** Bulk rename, move, duplicate, delete, and edit values across collections and modes. No more one-by-one editing.
>
> **Manage styles with precision.** Full CRUD for paint, text, effect, and grid styles. Bind unbound style properties to variables in bulk with the rebind scanner.
>
> **Export production CSS.** Skip JSON intermediaries. Export your variables as CSS custom properties with color-mix() opacity, Tailwind @theme inline blocks, and proper prefixes.
>
> **Import and sync tokens.** Bring tokens in from JSON or CSS files with conflict detection, override mode, and full undo support.
>
> **Generate token systems.** Start from Radix or Tailwind color palettes and generate a complete layered token system with typography scales, spacing, radius, and shadows.
>
> **Preview your system.** Built-in styleguide shows your color palettes, typography, spacing, and shadows in real time.

## License

MIT © You Zhang (ATOM63)
