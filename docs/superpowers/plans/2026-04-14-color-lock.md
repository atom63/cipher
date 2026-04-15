# Color Lock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users lock individual accent or neutral colors so they are skipped when shuffling.

**Architecture:** Add `locked?: boolean` to the `NamedBrandColor` and `NamedSurface` types; guard the two shuffle handlers to skip locked items; add a `Lock`/`Unlock` icon button to each color row in the UI.

**Tech Stack:** TypeScript, React, CSS Modules, Lucide icons (already in project)

---

### Task 1: Add `locked?` to color types and verify generation is unaffected

**Files:**
- Modify: `plugin/src/generators/three-tier.ts` (interfaces `NamedBrandColor` and `NamedSurface`)
- Modify: `plugin/__tests__/three-tier.test.ts`

- [ ] **Step 1: Add the `locked?` field to both interfaces**

In `plugin/src/generators/three-tier.ts`, find `NamedBrandColor` and `NamedSurface` and add `locked?: boolean`:

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

- [ ] **Step 2: Write a failing test that passes `locked: true` and verifies generation is unchanged**

Add to `plugin/__tests__/three-tier.test.ts` inside the existing `describe("generateDesignSystem"` block:

```ts
test("locked flag on brandColor does not affect token output", () => {
  const withoutLock = generateDesignSystem({ primary: "#3B82F6" });
  const withLock = generateDesignSystem({
    primary: "#3B82F6",
    brandColors: [{ name: "brand-primary", hex: "#3B82F6", locked: true }],
  });
  const mdSize = (result: typeof withoutLock) =>
    result.tokens.find((t) => t.figmaName === "font/typescale/base/size/md")?.value;
  expect(mdSize(withLock)).toBe(mdSize(withoutLock));
});
```

- [ ] **Step 3: Run the test — expect it to fail (type error or runtime)**

```bash
cd plugin && pnpm test --reporter=verbose 2>&1 | grep -A5 "locked flag"
```

Expected: fails because `locked` doesn't exist on `NamedBrandColor` yet (if you ran Step 2 before Step 1), or passes immediately after Step 1 — either way confirms the types are correct.

- [ ] **Step 4: Run full test suite to confirm nothing broken**

```bash
cd plugin && pnpm test 2>&1 | tail -6
```

Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add plugin/src/generators/three-tier.ts plugin/__tests__/three-tier.test.ts
git commit -m "feat(plugin): add locked field to NamedBrandColor and NamedSurface types"
```

---

### Task 2: Skip locked colors in shuffle handlers

**Files:**
- Modify: `plugin/src/pages/GeneratePage.tsx` (functions `handleShuffleAccents` and `handleShuffleNeutrals`)

- [ ] **Step 1: Update `handleShuffleAccents` to skip locked accents**

Find `handleShuffleAccents` (~line 845). Change the `.map` inside `setAccentColors` from:

```ts
return prev.map((a, i) => ({
  ...a,
  hex: randHex(
    0.65 + Math.random() * 0.13,
    0.14 + Math.random() * 0.1,
    (baseHue + i * goldenAngle + (Math.random() - 0.5) * 20) % 360,
  ),
}));
```

to:

```ts
return prev.map((a, i) =>
  a.locked
    ? a
    : {
        ...a,
        hex: randHex(
          0.65 + Math.random() * 0.13,
          0.14 + Math.random() * 0.1,
          (baseHue + i * goldenAngle + (Math.random() - 0.5) * 20) % 360,
        ),
      },
);
```

- [ ] **Step 2: Update `handleShuffleNeutrals` to skip locked neutrals**

Find `handleShuffleNeutrals` (~line 879). Change the `.map` inside `setNeutralColors` from:

```ts
return prev.map((n, i) => {
  const hue = (baseHue + i * goldenAngle + (Math.random() - 0.5) * 20) % 360;
  const hex = rgbToHex(
    oklchToRgb({ l: 0.55 + Math.random() * 0.1, c: 0.03 + Math.random() * 0.04, h: hue }),
  ).toUpperCase();
  return {
    ...n,
    preset: undefined,
    darkPreset: undefined,
    hex,
  };
});
```

to:

```ts
return prev.map((n, i) => {
  if (n.locked) return n;
  const hue = (baseHue + i * goldenAngle + (Math.random() - 0.5) * 20) % 360;
  const hex = rgbToHex(
    oklchToRgb({ l: 0.55 + Math.random() * 0.1, c: 0.03 + Math.random() * 0.04, h: hue }),
  ).toUpperCase();
  return {
    ...n,
    preset: undefined,
    darkPreset: undefined,
    hex,
  };
});
```

- [ ] **Step 3: Run full test suite**

```bash
cd plugin && pnpm test 2>&1 | tail -6
```

Expected: all passing.

- [ ] **Step 4: Commit**

```bash
git add plugin/src/pages/GeneratePage.tsx
git commit -m "feat(plugin): skip locked colors during shuffle"
```

---

### Task 3: Add lock button UI to accent and neutral rows

**Files:**
- Modify: `plugin/src/pages/GeneratePage.tsx`
- Modify: `plugin/src/pages/GeneratePage.module.css`

- [ ] **Step 1: Add `Lock` and `Unlock` to the lucide-react import**

Line 1 of `GeneratePage.tsx`:

```ts
import { Check, ChevronDown, Dices, Lock, RefreshCw, SlidersHorizontal, Unlock, Wand2, X } from "lucide-react";
```

- [ ] **Step 2: Add the lock button to the accent color row**

Find the accent `.colorInputRow` div (~line 1084). Insert the lock button between the color swatch `<input>` and the hex `<Input>`:

```tsx
<div className={styles.colorInputRow}>
  <input
    aria-label={`${accent.name} accent color`}
    className={styles.colorSwatch}
    onChange={(e) => updateAccent(index, { hex: e.target.value })}
    type="color"
    value={accent.hex}
  />
  <Button
    aria-label={accent.locked ? "Unlock color" : "Lock color"}
    data-locked={accent.locked ? "true" : undefined}
    className={styles.lockButton}
    onClick={() => updateAccent(index, { locked: !accent.locked })}
    size="icon"
    variant="ghost"
  >
    {accent.locked ? <Lock size={12} /> : <Unlock size={12} />}
  </Button>
  {/* existing hex Input and name Input follow unchanged */}
```

- [ ] **Step 3: Add the lock button to the neutral color row**

Find the neutral `.colorInputRow` div (~line 1177). Insert the lock button in the same position — between the color swatch `<input>` and the hex `<Input>`:

```tsx
<div className={styles.colorInputRow}>
  <input
    aria-label={`${neutral.name} neutral color`}
    className={styles.colorSwatch}
    onChange={(e) => updateNeutral(index, { hex: e.target.value })}
    type="color"
    value={displayHex}
  />
  <Button
    aria-label={neutral.locked ? "Unlock color" : "Lock color"}
    data-locked={neutral.locked ? "true" : undefined}
    className={styles.lockButton}
    onClick={() => updateNeutral(index, { locked: !neutral.locked })}
    size="icon"
    variant="ghost"
  >
    {neutral.locked ? <Lock size={12} /> : <Unlock size={12} />}
  </Button>
  {/* existing hex Input and name Input follow unchanged */}
```

- [ ] **Step 4: Add CSS for the lock button and locked row state**

Add to `plugin/src/pages/GeneratePage.module.css`:

```css
.lockButton {
  flex-shrink: 0;
  color: var(--muted-foreground);
  opacity: 0.4;
  transition: opacity var(--transition), color var(--transition);
}

.lockButton:hover {
  opacity: 1;
}

.lockButton[data-locked="true"] {
  color: var(--primary);
  opacity: 1;
}

.colorInputRow:has(.lockButton[data-locked="true"]) {
  outline: 1px solid color-mix(in oklch, var(--primary) 35%, transparent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

- [ ] **Step 5: Run full test suite**

```bash
cd plugin && pnpm test 2>&1 | tail -6
```

Expected: all passing.

- [ ] **Step 6: Manual verification in the plugin**

Build and load the plugin in Figma:
1. Open the Generate page — accent and neutral rows each have a small lock icon between the swatch and hex field
2. Click a lock icon — it switches to the filled Lock icon, row gets a subtle blue outline
3. Click Shuffle Accents — locked accent stays the same hex, unlocked ones change
4. Click Shuffle Neutrals — locked neutral stays the same, unlocked ones change
5. Click the lock again — it unlocks, next shuffle changes it

- [ ] **Step 7: Commit**

```bash
git add plugin/src/pages/GeneratePage.tsx plugin/src/pages/GeneratePage.module.css
git commit -m "feat(plugin): add lock button to accent and neutral color rows"
```
