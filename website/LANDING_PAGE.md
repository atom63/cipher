# Cipher — Landing Page Outline & Content

> Opinionated token system for Figma. Built for faster design-to-code workflows.

---

## Page Structure

### 1. Hero

**Headline:**
Design tokens that actually ship.

**Subheadline:**
Cipher generates a production-ready token system inside Figma — primitives, aliases, semantics — and exports CSS your codebase can use today.

**CTA:** Install from Figma Community

**Supporting visual:** Plugin screenshot showing the Generate config → live preview flow.

---

### 2. Problem / Why

**Headline:**
Your variables aren't a design system yet.

**Body:**
Figma gives you variables. But a production design system needs structure — a three-tier architecture where raw values feed aliases, and aliases feed semantic tokens your UI actually consumes. Building that by hand is tedious, error-prone, and breaks every time someone adds a new shade.

Cipher generates the entire system from a handful of inputs, keeps Figma and code in sync, and exports CSS that works with Tailwind v4 out of the box.

---

### 3. Core Workflow (3-column or step-by-step)

#### Generate
Configure your brand — primary color, surface tone, type scale, radius — and Cipher builds a complete three-tier token system directly in your Figma file.

- 11-shade OKLCH color ramps from a single hex
- 13 Radix gray presets + custom surface tints with saturation control
- Mathematical type scales (12 ratios from Minor Second to Golden Ratio)
- Responsive typography with breakpoint variants (mobile → tablet → desktop)
- Anchor-based radius, spacing grid, shadow elevations, z-layers, durations
- Status colors (danger, success, warning, info) with full ramps
- Dark mode built-in — not bolted on

#### Export
Download production-ready CSS organized into logical files — or copy individual tokens to clipboard.

- **primitives.css** — base colors, alphas, breakpoints
- **aliases.css** — surface scales (light/dark 1–12), duration aliases, font families
- **semantics.css** — UI tokens (--background, --foreground, --primary, etc.) with :root and .dark selectors
- **typescales.css** — responsive font-size and line-height with @media queries
- **effects.css** — layered shadow elevations and blur scale
- **radius.css** — anchor-based radius with calc() multiplier
- Tailwind CSS v4 `@theme inline` blocks included in every file
- Choose your color format: OKLCH, HEX, RGBA, or HSL
- Download as ZIP or copy individual files

#### Import
Bring CSS or JSON tokens back into Figma. Edit values in code, re-import, and Cipher updates the right variables.

- Parses CSS custom properties, `var()` references, and `color-mix()` opacity
- Auto-detects Cipher exports for seamless round-trip updates
- Per-token conflict resolution (import, skip, or override)
- Full undo for every import operation

---

### 4. Manage — Batch Operations

**Headline:**
Finally, bulk actions for Figma variables.

**Body:**
Rename, move, duplicate, scale, or delete variables across collections — with dependency checking so you don't break references. Bind paint styles to variables automatically using exact color match, path match, or name-based fallback. Undo everything.

**Key capabilities:**
- Multi-select and batch rename/move/delete
- Scale numeric values (e.g., adjust all spacing by ±10%)
- Search and filter across all collections
- Auto-rebind styles to variables (three matching strategies)
- Dependency checking before deletion

---

### 5. What Makes It Different

#### Three-Tier Architecture
Not a flat dump of variables. Cipher builds primitives → aliases → semantics, the same structure used by mature design systems at scale.

#### Color-Mix Opacity Preservation
The only Figma plugin that preserves style-level opacity through variable references using CSS `color-mix()`. Figma stores opacity separately from variable values — Cipher bridges that gap in the export.

#### Responsive Typography
Type scales aren't just static sizes. Cipher generates breakpoint-aware font-size and line-height values with `@media` queries, ready for responsive layouts.

#### OKLCH Color Science
Color ramps are generated in OKLCH color space for perceptually uniform lightness steps — not the hue-shifting heuristics most tools use.

#### Surface Saturation Control
Adjust the chroma of your entire gray palette with a single slider (0–200%). Go fully neutral or add a subtle brand tint without picking 24 new colors.

#### Auto-Detection on Update
Re-opening Cipher on a file with existing tokens? It reads your current config from the variables and pre-fills everything. Update your system without reconfiguring from scratch.

#### Tailwind v4 Native
Every CSS file includes `@theme inline` blocks. Drop the export into your Tailwind project — no config file gymnastics.

---

### 6. Token System Overview (Visual / Diagram)

**Show the three-tier flow:**

```
Primitives              Aliases                 Semantics
─────────────           ──────────              ─────────────
color/brand/primary/500 ─┐
color/brand/primary/400  │
color/gray/light/1 ──────┼─ surface/light/1 ───── background (Light)
color/gray/dark/1 ───────┼─ surface/dark/1 ────── background (Dark)
spacing/4                │
rounded/lg               │  duration/fast ──────── (CSS only)
font/family/sans ────────┼─ font/family/primary
                         │
                         └── (12 surface steps per mode)
```

**Stats from a typical generation:**
- ~230 primitives (colors, spacing, radius, shadows, typography, z-layers, durations, breakpoints)
- ~30 aliases (surfaces, duration semantics, font family mapping)
- ~37 semantics (UI tokens × Light/Dark modes)
- 7 CSS files, ready to ship

---

### 7. Export Preview (Code Block)

```css
/* semantics.css */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
}

:root {
  --background: var(--surface-light-2);
  --foreground: var(--surface-dark-12);
  --primary: var(--color-brand-primary-500);
  --border: var(--surface-light-6);
  --ring: var(--color-brand-primary-500);
}

.dark {
  --background: var(--surface-dark-1);
  --foreground: var(--surface-light-12);
  --primary: var(--color-brand-primary-400);
  --border: var(--surface-dark-6);
}
```

---

### 8. Privacy & Trust

- Runs entirely inside Figma — no external servers, no analytics, no data leaves your file
- MIT licensed, open source
- All operations are undoable

---

### 9. Footer CTA

**Headline:**
Stop hand-wiring tokens. Start shipping.

**CTA:** Install Cipher from Figma Community

**Links:** GitHub · MIT License · Contact (hello@atom63.com)

---

## Page Notes

- **Tone:** Direct, technical, confident. No marketing fluff. Speak to designers who write code and engineers who care about design systems.
- **Visuals:** Plugin screenshots > illustrations. Show real UI, real CSS output, real Figma variables.
- **Above the fold:** Hero + problem statement. The user should understand what Cipher does and why within 5 seconds.
- **Mobile:** The page itself should demonstrate good responsive design — practice what the plugin preaches.
