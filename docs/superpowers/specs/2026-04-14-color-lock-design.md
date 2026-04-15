# Color Lock Feature — Design Spec

**Date:** 2026-04-14
**Scope:** Figma plugin — GeneratePage color configuration

## Overview

Users can lock individual accent or neutral colors so they are skipped during shuffle. A locked color keeps its hex value (and neutral preset) unchanged when "Shuffle Accents" or "Shuffle Neutrals" is clicked.

## State

Add `locked?: boolean` to the existing `NamedBrandColor` and `NamedSurface` types in `plugin/src/generators/three-tier.ts`.

```ts
export interface NamedBrandColor {
  hex: string;
  locked?: boolean;
  name: string;
}

export interface NamedSurface {
  darkHex?: string;
  darkPreset?: string;
  hex?: string;
  locked?: boolean;
  name: string;
  preset?: string;
}
```

`locked` defaults to `undefined` (falsy) — no migration needed for existing state.

## Shuffle Behavior

`handleShuffleAccents` in `GeneratePage.tsx` skips any accent where `locked === true`:

```ts
return prev.map((a, i) =>
  a.locked
    ? a
    : { ...a, hex: randHex(...) }
);
```

`handleShuffleNeutrals` skips any neutral where `locked === true`, preserving its `hex`, `preset`, and `darkPreset`:

```ts
return prev.map((n, i) =>
  n.locked
    ? n
    : { ...n, preset: undefined, darkPreset: undefined, hex: ... }
);
```

Status colors (danger/success/warning/info) are not lockable — their shuffle is already constrained to semantic hue ranges.

## UI

**Lock button placement:** Between the color swatch and the hex input (option B), on both accent rows and neutral rows.

**Component:** Lucide `Lock` / `Unlock` icon in an `icon` size `Button` with `ghost` variant.

**Locked state visual:**
- Button: `variant="ghost"` with blue tint (inline style or a `data-locked` attribute + CSS)
- Row container: subtle blue border ring (`border-color: var(--color-info)` or equivalent token)

**Unlocked state visual:**
- Button: `variant="ghost"`, muted icon color — same as the existing remove button at rest

**Toggle handler:** reuse existing `updateAccent` / `updateNeutral` helpers:

```ts
onClick={() => updateAccent(index, { locked: !accent.locked })}
onClick={() => updateNeutral(index, { locked: !neutral.locked })}
```

## Files Changed

| File | Change |
|------|--------|
| `plugin/src/generators/three-tier.ts` | Add `locked?: boolean` to `NamedBrandColor` and `NamedSurface` |
| `plugin/src/pages/GeneratePage.tsx` | Add lock button to accent and neutral rows; update shuffle handlers |

No changes needed to token generation, CSS export, or import logic — `locked` is UI-only state that does not flow into `generateDesignSystem()`.
