---
title: "Cipher Product Truth (Website Source)"
date: "2026-03-13"
type: "page"
description: "Canonical product truth for website copy, claims, and positioning."
tags: ["plugin", "product-truth", "website", "design tokens", "figma"]
---

This document is the canonical source for what Cipher does today.

Use it to write website copy, landing page sections, feature comparisons, and product messaging without drifting from reality.

---

## Product Definition

Cipher is a local-only Figma plugin that helps teams:

- generate a structured design token system in Figma,
- manage variables and styles at scale,
- round-trip tokens between Figma and code,
- export production-ready CSS and JSON.

Core promise: move from "raw variables" to a usable token system for real product code.

---

## What Exists Today (Truth)

### 1) Generate

Cipher can generate a complete token system inside Figma from configurable inputs:

- primary color (and optional secondary),
- neutral surfaces (Radix preset or custom hex),
- surface saturation,
- status colors,
- radius anchor,
- typography scale and line-height behavior,
- font family mappings (from available Figma fonts).

Generated system structure follows a three-tier model:

- **primitives** (raw values),
- **aliases** (mapped references),
- **semantics** (UI-facing tokens).

It supports both:

- first-time generation in an empty file,
- update flow for existing Cipher-style systems (with config extraction from current variables).

---

### 2) Manage Variables

Cipher includes a variable manager with bulk operations:

- search/filter/sort across collections and types,
- rename,
- move across collections,
- duplicate,
- delete with dependency check,
- edit values by mode,
- scale numeric values (multiply/divide),
- swap references,
- undo for key operations via saved snapshots.

---

### 3) Manage Styles

Style management supports paint/text/effect/grid styles:

- browse with visual previews,
- search/filter,
- rename/delete/duplicate/edit,
- scan unbound style properties and suggest rebind targets,
- apply rebind in batch and undo rebind.

---

### 4) Export

Cipher exports variables as:

- **JSON tokens**
- **CSS token files**

CSS export includes:

- split files (`primitives.css`, `aliases.css`, `semantics.css`, `typography.css`, `effects.css`, `radius.css`, `index.css`),
- selectable color formats (`oklch`, `hex`, `rgba`, `hsl`),
- Tailwind v4 `@theme inline` blocks,
- ZIP download and per-file copy/download.

Important differentiator implemented in code:

- style-level opacity preservation via `color-mix(...)` when exporting variable references used by styles with opacity.

---

### 5) Import / Round-trip

Cipher imports:

- JSON token files,
- CSS token files,
- folders,
- ZIP archives.

Import flow includes:

- parse + preview before write,
- conflict check,
- import mode control (`import` vs `override`),
- reference-aware creation (non-reference pass, then reference pass),
- undo import.

Combined JSON with style data is supported (variables imported first, styles after).

---

### 6) Settings and UX

- theme preference persistence,
- export color format persistence,
- compact/default window mode,
- debug mode toggle (keyboard shortcut) for UI development.

---

## Audience and Jobs-to-be-Done

### Primary users

- Designers building and maintaining tokenized design systems in Figma.
- Developers consuming exported tokens/CSS in product codebases.

### Core jobs

- Create a full token architecture quickly from a small set of brand decisions.
- Keep design tokens synchronized between Figma and code.
- Export outputs that can be adopted in real frontend stacks immediately.
- Safely perform large-scale token/style operations in existing files.

---

## Messaging Pillars (Claim-Safe)

### Pillar 1: Structure, not raw variables

Suggested phrasing:

- "Figma gives you variables. Cipher gives you a full token system."
- "Generate primitives, aliases, and semantics in one flow."

### Pillar 2: Round-trip between design and code

Suggested phrasing:

- "Export to production CSS/JSON, edit, and re-import back to Figma."
- "Conflict-aware import with preview and undo."

### Pillar 3: Production-ready outputs

Suggested phrasing:

- "Tailwind v4-friendly CSS exports with `@theme inline`."
- "Preserves style-level opacity with `color-mix()` in export."

### Pillar 4: Control at scale

Suggested phrasing:

- "Bulk manage variables and styles safely."
- "Dependency-aware deletes, rebind suggestions, and undo."

---

## Claims to Avoid (Important)

Do not claim unless implemented first:

- "Real-time team collaboration" (not a plugin feature),
- "Cloud sync/history" (no remote backend),
- "AI token generation" (not implemented),
- "Automatic WCAG compliance guarantees" (not guaranteed),
- "Works outside Figma" (plugin is Figma-specific),
- "Zero-conflict imports" (conflicts exist; plugin provides handling).

---

## Trust and Privacy Truth

- runs locally inside Figma plugin environment,
- no external network calls in plugin manifest,
- no telemetry/analytics pipeline in plugin logic,
- settings persisted via `figma.clientStorage`.

Use precise language: "local-only", "no external servers", "no telemetry".

---

## Information Architecture for Website

Recommended page structure:

1. **Hero**: one-sentence value proposition + install CTA.
2. **Why it exists**: variables vs true token architecture gap.
3. **Generate**: brand-to-system workflow.
4. **Manage**: variable/style operations and safety controls.
5. **Export/Import round-trip**: code output + sync back to Figma.
6. **Differentiators**: opacity preservation, responsive typography, three-tier model.
7. **Trust**: local-only, no telemetry.
8. **Final CTA**: install + docs + source.

---

## Proof Assets to Capture (for website screenshots)

- Generate page with live previews (colors, type, radius),
- Manage variables bulk actions toolbar,
- Styles page rebind suggestion panel,
- Export CSS preview (accordion + ZIP action),
- Import review table with conflicts.

Use real plugin UI screenshots over abstract illustrations.

---

## One-Line Positioning Options

Pick one as homepage headline candidate:

- "Design tokens that actually ship."
- "From Figma variables to production token systems."
- "Generate, manage, and round-trip tokens between Figma and code."
