# Product Requirements Document: Cipher

**Version:** 3.0
**Last Updated:** March 6, 2026
**Status:** Active Development
**Owner:** You Zhang (ATOM63)

---

## Executive Summary

**Cipher** is a Figma plugin for **managing and exporting design tokens**. It solves two problems that Figma's native UI doesn't:

1. **Variable & style management is painful** — Figma only supports one-by-one editing. Cipher provides fast batch CRUD operations with a visual editor.
2. **Getting tokens into code is indirect** — Figma exports JSON that still needs transformation. Cipher exports production-ready CSS (with CSS variables, `color-mix()` opacity, `@theme inline` for Tailwind) directly from the plugin.

### The Problems

- **Figma's variable editor is slow**: No bulk rename, no find/replace, no batch value changes, no cross-collection operations. Managing 500+ tokens is tedious.
- **Export requires a pipeline**: Figma Variables → JSON → external script → CSS → code. Too many steps for what should be one action.
- **Opacity is lost in translation**: Figma stores opacity separately from color values. Standard exports drop it. Recovering it requires traversing `styles.json` metadata.
- **Token structure is tribal knowledge**: Setting up a proper layered token system (primitives → aliases → semantics) requires expertise most teams don't have.

### The Solution

- **Batch variable manager**: Fast, visual CRUD for Figma variables and styles — the editor Figma should have built.
- **Direct-to-CSS export**: Skip JSON intermediaries. Export Figma Variables as production CSS with opacity preservation, Tailwind compatibility, and proper prefixes.
- **JSON import/export**: Bidirectional JSON support for teams that need it, but CSS is the primary export format.
- **Guided token structure**: Opinionated 4-layer defaults with flexibility to customize.

### Unique Value Proposition

**The fastest way to manage Figma variables and get them into production CSS — with opacity preserved and Tailwind ready.**

---

## Target Users

### Primary: Design System Engineers

- Maintain 200-1000+ tokens across multiple collections
- Need to bulk rename, restructure, and update variables regularly
- Want production CSS output, not intermediate JSON
- **Pain**: Figma's one-by-one variable editing; multi-step export pipelines

### Secondary: Frontend Developers

- Consume design tokens in React/Vue/Svelte projects
- Use Tailwind CSS or CSS custom properties
- Need exact color values with opacity
- **Pain**: Manual CSS generation from Figma exports; opacity loss

### Tertiary: Product Designers

- Create and maintain design systems in Figma
- Export tokens for developer handoff
- **Pain**: No efficient way to manage large variable sets or verify export accuracy

---

## Feature Architecture

### Three Pillars

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     MANAGE      │  │     EXPORT      │  │     IMPORT      │
│                 │  │                 │  │                 │
│ Batch CRUD for  │  │ Figma Variables │  │ JSON/CSS tokens │
│ variables and   │  │ → production    │  │ → Figma         │
│ styles          │  │   CSS/JSON      │  │   Variables     │
│                 │  │                 │  │                 │
│ P0 - Core       │  │ P1 - Primary    │  │ P1 - Built      │
│                 │  │     output      │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## P0: Variable & Style Manager

The core daily-use feature. A fast, visual batch editor for Figma variables and styles.

### Why This Is P0

Figma's native variable panel supports only single-item editing. For any team with 100+ tokens, common operations are painfully slow:
- Renaming a color scale from `gray` to `slate` across 12 shades
- Moving tokens between collections
- Updating mode values across dozens of semantic tokens
- Deleting deprecated token groups

No plugin currently does this well. This is the standalone value prop.

### Batch Operations

#### Bulk Rename
- Find/replace across variable names (plain text and regex)
- Scope: all variables, specific collection, or current selection
- Preview changes before applying
- Support prefix/suffix add/remove

#### Bulk Value Edit
- Swap references (e.g., change all `{primitives.zinc.*}` refs to `{primitives.slate.*}`)
- Scale numeric values (multiply all spacing by 1.5)
- Batch set mode values (set Dark mode for 20 tokens at once)

#### Bulk Organize
- Move variables between collections
- Reorder and restructure token groups
- Bulk delete with dependency warnings
- Duplicate tokens/groups across collections

#### Visual Editor UX
- Table view with inline editing (click to edit any cell)
- Multi-select with Shift/Cmd click
- Keyboard shortcuts for common actions (rename, delete, duplicate)
- Color preview swatches inline
- Filter/search across all variables
- Undo support for batch operations

### Styles Management
- Same batch operations for Figma Styles (paint, text, effect)
- Style → Variable migration helper (convert legacy styles to variables)

---

## P1: Export — Direct to CSS

The primary export format is **production-ready CSS**, not JSON. The plugin should output files a developer can drop into their project and use immediately.

### Why CSS First

The current workflow is: export JSON → run `generate-tokens.js` → get CSS files. That script does real work — opacity detection via `color-mix()`, reference resolution, `@theme inline` blocks, responsive typography, shadow extraction, Tailwind utility mapping. That logic should live **in the plugin**, eliminating the external script step.

JSON export remains available as a secondary format for teams that need it (Style Dictionary pipelines, cross-platform, etc.).

### CSS Export Features

#### Core Output
- CSS custom properties with proper prefixes (`--color-*`, `--spacing-*`, `--radius-*`)
- `color-mix(in srgb, ...)` for opacity preservation
- `@theme inline` blocks for Tailwind CSS compatibility
- Light/Dark mode via `:root` and `.dark` selectors
- Responsive typography via media queries and `data-window-size` attributes
- Shadow tokens from effect styles

#### Output Structure
Match the current `exports/styles/` structure:
```
tokens/
  primitives.css      — Raw values (colors, spacing, typography, radius)
  aliases.css         — Semantic mappings with @theme inline
  semantics.css       — Context-aware tokens (Light/Dark modes)
  typography.css      — Font families, weights, and responsive typescales
  shadow-tokens.css   — Shadow elevation tokens
  radius.css          — Border radius tokens
  index.css           — Imports all token files
tailwind-colors.css   — Full OKLCH color palette for Tailwind
index.css             — Master entry point
```

#### Export UX
- Select collections to export
- Choose color format (OKLCH, HEX, RGBA, HSL)
- Preview generated CSS in plugin with syntax highlighting
- Copy individual files or all CSS to clipboard
- Download as ZIP
- Remember last export settings

### JSON Export (Secondary)
- Export selected collections as `tokens.json`
- Include `styles.json` with Figma metadata (opacity, effects)
- W3C DTCG format option (`$value`, `$type`) for ecosystem interop
- Maintain token references in output

---

## P1: Import — JSON to Figma

Already built and working. Maintained as-is with incremental improvements.

### Current Capabilities (Built)
- Parse `tokens.json` and create Figma Variables
- Multi-collection support
- Mode support (Light/Dark, responsive breakpoints)
- Type support (COLOR, FLOAT, STRING)
- Token reference resolution (`{primitives.zinc.50}`)
- Change tracking (created/updated/unchanged)
- Batch rename before import
- Override vs append modes

### Planned Improvements
- **Validation on import**: Check for broken references, circular dependencies, invalid values before creating variables
- **CSS import**: Parse CSS custom property files to create Figma variables (closing the bidirectional loop without JSON)
- **Conflict resolution**: When importing over existing variables, show diff and let user choose per-token

---

## P2: Token Structure & Onboarding

The 4-layer architecture is opinionated and effective, but shouldn't be forced on users.

### 4-Layer Token System (Default)

```
primitives/      → Raw values (colors, spacing, typography, radius)
aliases/         → Semantic mappings (surface, primary, accent)
semantics/       → Context-aware tokens with modes (Light/Dark)
responsive/      → Viewport-aware tokens (mobile/tablet/desktop)
```

### Guided Flexibility
- **First-run setup**: Ask what layers the user needs, with presets:
  - **Full system** (default): All 4 layers — for mature design systems
  - **Simple**: Primitives + Semantics — for small teams
  - **Flat**: Single collection — for prototyping
- **Templates**: Pre-built token structures users can import as starting points
- **Documentation**: In-plugin tooltips explaining each layer's purpose
- **No lock-in**: Users can rename, add, or remove layers freely

---

## P3: Styleguide

Visual preview of the token system. Already partially built.

- Color palette visualization with swatches
- Typography scale preview
- Spacing scale visualization
- Shadow elevation preview
- WCAG contrast checking for color pairs

---

## Current Implementation Status

### Built
- [x] JSON import with full variable creation pipeline
- [x] JSON export (variables and styles)
- [x] Multi-collection and mode support
- [x] Token reference resolution
- [x] Change tracking and import preview
- [x] Batch rename (find/replace with regex, prefix/suffix)
- [x] Bulk value edit (inline editor, alias picker, scale numeric)
- [x] Bulk organize (move between collections, duplicate, delete with dependency warnings + undo)
- [x] Multi-select (Shift/Cmd click) with keyboard shortcuts
- [x] Styles management (batch rename, batch delete, rebind to variables)
- [x] Settings with `clientStorage` persistence
- [x] Toast notifications and confirmation dialogs
- [x] Styleguide page (basic)
- [x] Type-safe message system between UI and plugin
- [x] CSS Module architecture with scoped styles
- [x] Direct CSS export from plugin (CSS generation engine embedded)
- [x] CSS import (parse CSS custom properties → Figma variables)
- [x] Import validation (broken refs, circular deps, duplicates, type mismatches)

### External (Not in Plugin)
- [x] `generate-tokens.js` — Full CSS generation pipeline (1150 lines)
  - Opacity detection from `styles.json` via `color-mix()`
  - `@theme inline` Tailwind blocks
  - Responsive typography with media queries
  - Shadow token extraction
  - Token reference → CSS variable resolution

### Not Built
- [ ] Token structure templates/onboarding (P2)
- [ ] CSS preview with syntax highlighting
- [ ] Style → Variable migration helper

---

## Technical Architecture

### Stack
- **Plugin**: React 18, TypeScript, esbuild
- **Build**: Bun for package management, custom `build.js`
- **Styling**: CSS Modules (components) + SCSS (global tokens/layout)
- **Code Quality**: Biome
- **Figma API**: Variables API, Styles API, `clientStorage` for persistence

### Key Architecture Decisions

#### 1. CSS Modules for Plugin UI
Scoped styles per component, global SCSS only for design tokens and layout. Prevents class name conflicts in the single-file plugin bundle.

#### 2. Typed Message Protocol
Discriminated union types for all UI ↔ plugin communication. No `any` types crossing the iframe boundary.

#### 3. File-based Token System
JSON files, not cloud. Git-friendly, works offline, no backend needed.

#### 4. Dynamic Opacity Detection
Auto-traverse `styles.json` to find opacity values rather than hardcoded mappings. Found 100 tokens with opacity vs 26 with manual mapping.

#### 5. Separate Token + Styles Files
`tokens.json` for clean values, `styles.json` for Figma-specific metadata (opacity, gradients, effects). Separation of concerns.

---

## UI/UX Principles

1. **Speed first**: Batch operations should feel instant. No unnecessary confirmation dialogs for reversible actions.
2. **Show before doing**: Preview changes before applying. Especially for batch operations that affect many tokens.
3. **Figma-native feel**: Match Figma's visual language — colors, typography, spacing, interaction patterns.
4. **Keyboard-friendly**: Power users should be able to work without touching the mouse for common operations.
5. **Progressive disclosure**: Simple defaults, advanced options available but not in the way.

---

## Success Metrics

### North Star
**Time saved per design system update cycle**
- Variable management: 10x faster than Figma's native editor for batch operations
- Export: One-click to production CSS vs multi-step pipeline

### Quality
- 100% opacity preservation accuracy in CSS export
- Zero data loss on import/export round-trips
- < 1s for batch operations on 500+ tokens
- < 3s for full CSS generation of 1000+ tokens

---

## Release Plan

### v0.9.0 — Current
All three pillars built and functional:
- Variable & Style Manager with batch CRUD, multi-select, keyboard shortcuts
- CSS + JSON export with `color-mix()` opacity, `@theme inline`, Tailwind compat
- JSON + CSS import with validation, batch rename, collection/mode support
- Settings with theme persistence, toast notifications, confirmation dialogs

### v1.0.0 — Ship
- UI polish and visual consistency across all pages
- CSS preview with syntax highlighting
- Performance optimization for large token sets (500+ tokens)
- Documentation complete
- Plugin ID set for Figma Community

---

## Out of Scope

- **Cloud sync / GitHub integration**: File-based workflow is sufficient. Let git handle versioning.
- **Palette generator**: Use existing tools (Radix, Tailwind, Realtime Colors). Cipher manages tokens, not creates palettes.
- **In-plugin token value authoring from scratch**: Edit in Figma or code, use Cipher to manage and export.
- **Multi-platform export (iOS/Android)**: Focus on web (CSS) first. JSON export covers cross-platform needs.
- **Real-time collaboration features**: Figma already handles multiplayer. Cipher operates on the local file.

---

## Resources

### Documentation
- [README.md](./README.md) — Getting started
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Technical architecture and component patterns
- Feature matrix is consolidated into this PRD (see "Current Implementation Status" and "Release Plan")

### References
- [Figma Variables API](https://www.figma.com/plugin-docs/api/Variable/)
- [Figma Plugin Development](https://www.figma.com/plugin-docs/)
- [W3C Design Tokens Format](https://www.w3.org/community/design-tokens/)
- [Tailwind CSS v4 Theme](https://tailwindcss.com/docs/theme)

---

**Status:** Living Document
**Next Review:** Weekly during active development
