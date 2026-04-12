# Design Critique: Cipher Plugin UI

## Purpose

Evaluate whether Cipher's interface works as a *designed experience* — not just technically, but as something that embodies the brand promise: **make hidden structure readable**. This critique checks visual hierarchy, information architecture, emotional resonance, and design quality against the brand strategy, then ranks issues by impact.

## Verdict

**The UI is clean, purposeful, and largely on-brand.** No major AI-slop patterns. The design token system is sophisticated and the component library is mature. Two hard-coded purple gradients and some inconsistent page-level polish are the main breaks from brand integrity. The Import flow is the high-water mark; the Manage page — where users spend most of their time — needs to match it.

---

## What's Working

**1. The Import flow is genuinely well-designed.**
The multi-step progression (Upload > Select > Review > Progress > Success) demonstrates real UX thinking. The BatchRenameDialog's two-column layout with live preview makes a complex operation feel approachable. The ProgressView shows categorized error breakdowns instead of generic failures. This is the standard the rest of the plugin should match.

**2. The token system embodies the brand.**
OKLCH color space, 200+ semantic tokens, full dark mode through Figma's `.figma-dark` class — this is infrastructure-level thinking applied to the plugin's own design. A design token plugin built on a rigorous token system has inherent credibility. The audience will notice.

**3. Micro-interactions are present but never attention-seeking.**
Buttons lift 1px on hover. Dialogs use cubic-bezier easing. Checkboxes pop on check. The Animation component respects `prefers-reduced-motion`. These are exactly the "quiet confidence" the brand strategy calls for — felt, not seen.

---

## Issues by Priority

### P0 — Hard-coded purple gradient breaks brand integrity

`#764ba2` appears in `ui.scss` (lines 338, 446) for view-mode headers and coming-soon badges. This color exists outside the token system entirely.

The brand strategy says *precise*, *dependable*, *restrained accent usage*. A hard-coded purple-to-blue gradient is the opposite. It also breaks dark mode — when everything else adapts, these stay fixed. A token management tool that doesn't use its own tokens undermines its credibility.

**Fix:** Replace with token-based gradient or (better) question whether these elements need gradients at all. A solid `var(--primary)` at reduced opacity would be more on-brand.

**Command:** `/normalize`

---

### P1 — Manage page visual density crisis

ManagePage renders flat data tables with 32px rows, 16px color swatches, tiny mode labels, and no visual grouping beyond collection headers. At 500+ variables, this becomes a wall of undifferentiated text.

This is where users spend 80% of their time. The brand promises to make structure *readable* — but this page makes structure harder to read at scale.

**Fix:** Increase row height to 40px, color swatches to 20px. Add alternating row tints or group separators. Implement virtual scrolling for large lists. Consider a compact/comfortable density toggle.

**Command:** `/optimize` for virtualization, `/quieter` for density

> *Question: Does the Manage page need to feel like a spreadsheet?* The table layout forces data into a grid that may not match the user's mental model. The Import flow's token table works because it's a review step — but Manage is a workspace. Workspaces need different spatial logic.

---

### P2 — Inconsistent page-level design quality

The Import flow has careful multi-step progression and clear visual hierarchy. The Manage page is raw data tables. The Generate page has non-interactive color swatches. The Styleguide page is a component kitchen sink with no documentation.

Users form their impression from the *weakest* page, not the strongest. A polished Import flow followed by a bare Manage page creates a "demo vs. real product" feeling. The target audience (design system professionals) will notice immediately.

**Fix:**
- **Manage** — Apply the same level of visual composition as Import: section headers, clear action zones, breathing room
- **Generate** — Make color swatches interactive (`<input type="color">`), validate inline not on submit
- **Styleguide** — Either add usage guidelines to make it a real reference, or remove it entirely

**Command:** `/polish` for Manage, `/clarify` for Generate, `/distill` for Styleguide

> *Question: Is the Styleguide page serving anyone?* A component showcase without documentation, usage guidelines, or accessibility notes is a liability. For a brand that values "readable structure," an unreadable styleguide is contradictory.

---

### P3 — Clickable divs without keyboard semantics

Multiple pages use `<div onClick>` for selection targets — variable rows (ManagePage), style rows (StylesPage), collection cards (ExportPage), drop zones (ImportPage). No `role`, `tabIndex`, or keyboard handlers.

Beyond the WCAG 2.1.1 violation, this creates a trust gap. When interactive-looking elements get skipped during keyboard navigation, the interface feels unreliable. For a brand built on "dependable" and "trustworthy," keyboard inaccessibility is a direct contradiction.

**Fix:** Convert to `<button>` elements or add `role="button" tabIndex={0} onKeyDown={handleEnterOrSpace}`. Create a shared pattern — a `<ClickableRow>` component or `useClickableDiv` hook — so this is solved once.

**Command:** `/harden`

---

### P4 — Focus rings removed from native inputs

`ui.scss` applies `outline: none !important; box-shadow: none !important;` to checkbox and radio inputs on focus. This removes all visual focus indication for keyboard users (WCAG 2.4.7 failure).

The `!important` declarations suppress default browser outlines, but the replacement focus styles only exist on custom component wrappers, not the native inputs. If a user tabs to an unstyled checkbox, they get zero feedback.

**Fix:**
```css
input[type="radio"]:focus-visible,
input[type="checkbox"]:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

**Command:** `/harden`

---

### P5 — Dialog sizing overflows narrow viewports

Dialog max-width values (480px, 600px, 800px) exceed Figma's minimum 300px plugin width. Dropdown menus use absolute positioning without viewport boundary detection.

**Fix:** Use `min(Xpx, calc(100vw - 2rem))` for all dialog max-widths. Add viewport boundary clamping to Dropdown.

**Command:** `/adapt`

---

### P6 — Disabled button state fails for colorblind users

Disabled buttons use `filter: grayscale(30%)` — a visual cue that colorblind users may not perceive. Combined with `opacity: 0.6`, the disabled state relies entirely on subtle color/opacity shifts rather than clear structural indicators.

**Fix:** Replace grayscale filter with muted border color and text color changes that work regardless of color perception.

**Command:** `/harden`

---

### P7 — Badge dot animations run infinitely on all badges

The pulse animation (2s infinite) runs on every badge with a dot indicator. A page with 20+ status badges means 20 concurrent infinite animations — unnecessary GPU pressure.

**Fix:** Make the animation opt-in (e.g., only on `status="active"` badges) or limit to 3 cycles.

**Command:** `/optimize`

---

### P8 — Color-mix function inconsistency

Alert component uses `oklch` for color-mixing while the rest of the codebase uses `srgb`. This produces subtly different tints for the same logical operation.

**Fix:** Standardize on `srgb` (already used everywhere else) or deliberately choose `oklch` and migrate all instances.

**Command:** `/normalize`

---

### P9 — Unused and legacy tokens

- `--sidebar-width` and `--sidebar-collapsed` defined but never used
- ~~`--shadow-shadow-*`~~ — fixed: UI now references `--shadow-xs` / `--shadow-md` / `--shadow-xl` (Tailwind-aligned)
- `--muted-foreground-light`, `--border-light`, `--success-light` are undocumented variants

Dead tokens in a token management tool are ironic.

**Fix:** Remove unused tokens. Rename shadow variables. Either formalize legacy aliases or migrate consumers to primary tokens.

**Command:** `/normalize`

---

### P10 — Seven card variants, questionable ROI

Default, muted, bordered, outline, elevated, glass, gradient — seven styles for a single component. Glass uses `backdrop-filter: blur(12px)`. Gradient uses a pseudo-element mask trick. Are glass and gradient used anywhere in the actual plugin UI, or only in the Styleguide showcase?

The brand says "modular, logical, organized." Seven variants for one component suggests a library designed for *possibility* rather than *purpose*.

**Fix:** Audit which variants are actually used in the product. Remove any that exist only in the Styleguide. Keep the component API for future use if needed, but don't maintain CSS for unused variants.

**Command:** `/distill`

> *Question: Does every variant earn its place?* If glass and gradient only appear in the Styleguide, they're adding complexity without serving the product.

---

## Brand Alignment Check

| Brand attribute | Status | Notes |
|---|---|---|
| **Precise** | Strong | Token system, spacing scale, consistent components |
| **Dependable** | Mixed | Import flow yes; Manage page density and keyboard gaps undermine this |
| **Systematic** | Strong | OKLCH color, semantic naming, modular components |
| **Readable** | Mixed | Good hierarchy in Import; Manage page is the weak link |
| **Intelligent** | Strong | Sophisticated color-mixing, cubic-bezier easing, smart defaults |
| **Quiet** | Mostly | The purple gradient is the one loud note in an otherwise restrained palette |

---

## Suggested Fix Sequence

1. `/normalize` — Remove hard-coded gradient, fix token inconsistencies (P0, P8, P9)
2. `/harden` — Keyboard semantics, focus rings, disabled states (P3, P4, P6)
3. `/polish` — Manage page density and visual composition (P1, P2)
4. `/adapt` — Dialog and dropdown viewport handling (P5)
5. `/optimize` — Badge animation, virtualization (P7, P1)
6. `/distill` — Audit card variants, Styleguide page (P10, P2)

---

*This is a critique, not a fix. Issues documented for review and prioritization.*
