# Design Tokens Alignment

## Overview

The plugin's UI design tokens in `ui.scss` now match the primitives in `sample-tokens.json`, ensuring consistency between the plugin UI and the design system it manages.

**Philosophy:** We "eat our own dog food" 🐕 - the plugin uses the same design system it helps manage!

**Structure:** Follows shadcn/ui's semantic color system for modern, maintainable design tokens.

---

## Changes Made

### Color System

**Before:**
```scss
/* Hardcoded color values */
--background: #ffffff;
--foreground: #111111;
--primary: #0754ab;
--muted: #f7f7f7;
--border: #e5e5e5;
--success: #10b981;
--error: #dc2626;
```

**After:**
```scss
/* Color Primitives (from sample-tokens.json) */
--color-zinc-50: oklch(0.985 0 0);
--color-zinc-100: oklch(0.967 0.001 286.375);
// ... full zinc scale
--color-emerald-500: oklch(0.696 0.17 162.48);
// ... full emerald scale
--color-rose-500: oklch(0.645 0.246 16.439);
--color-amber-500: oklch(0.769 0.188 70.08);
--color-blue-500: oklch(0.623 0.214 259.815);

/* Semantic Colors (shadcn-style) */
--background: var(--color-zinc-50);
--foreground: var(--color-zinc-950);
--primary: var(--color-emerald-600);
--card: var(--color-zinc-50);
--popover: var(--color-zinc-50);
--muted: var(--color-zinc-100);
--accent: var(--color-zinc-300);
--destructive: var(--color-rose-500);
--success: var(--color-emerald-500);
--warning: var(--color-amber-500);
--info: var(--color-blue-500);
--border: var(--color-zinc-200);
--input: var(--color-zinc-400);
--ring: var(--color-emerald-500);
```

**Dark Mode Support:**
```scss
.dark {
  --background: var(--color-zinc-950);
  --foreground: var(--color-zinc-50);
  --muted: var(--color-zinc-800);
  --border: var(--color-zinc-800);
  // ... all semantic colors updated for dark mode
}
```

**Impact:**
- ✅ Uses OKLCH color space (perceptually uniform)
- ✅ Matches `primitives.zinc`, `primitives.emerald`, etc.
- ✅ Semantic naming (shadcn/ui convention)
- ✅ Dark mode ready
- ✅ Better color consistency
- ✅ Easier to maintain

---

### Spacing Scale

**Before:**
```scss
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 20px;
--spacing-2xl: 24px;
--spacing-3xl: 40px;
--spacing-4xl: 60px;
```

**After:**
```scss
--spacing-0: 0px;      /* NEW */
--spacing-2xs: 2px;    /* NEW */
--spacing-xs: 4px;
--spacing-sm: 6px;     /* Changed from 8px */
--spacing-md: 8px;     /* Changed from 12px */
--spacing-lg: 12px;    /* Changed from 16px */
--spacing-xl: 16px;    /* Changed from 20px */
--spacing-2xl: 24px;
--spacing-3xl: 32px;   /* Changed from 40px */
--spacing-4xl: 48px;   /* Changed from 60px */
--spacing-5xl: 64px;   /* NEW */
--spacing-6xl: 96px;   /* NEW */
--spacing-7xl: 128px;  /* NEW */
```

**Impact:**
- ✅ More granular spacing options (13 vs 8)
- ✅ Matches `primitives.spacing` tokens exactly
- ✅ Better alignment with Tailwind CSS conventions

---

### Border Radius

**Before:**
```scss
--radius-xs: 3px;
--radius-sm: 4px;
--radius: 6px;
--radius-md: 8px;
--radius-lg: 10px;
--radius-xl: 16px;
--radius-pill: 20px;
--radius-full: 50%;
```

**After:**
```scss
--radius-0: 0px;       /* NEW */
--radius-xs: 2px;      /* Changed from 3px */
--radius-sm: 4px;
--radius: 6px;         /* Base - unchanged */
--radius-md: 8px;
--radius-lg: 12px;     /* Changed from 10px */
--radius-xl: 16px;
--radius-2xl: 24px;    /* NEW */
--radius-3xl: 32px;    /* NEW */
--radius-full: 9999px; /* Changed from 50% */
```

**Impact:**
- ✅ More radius options (10 vs 8)
- ✅ Matches `primitives.radius` tokens exactly
- ✅ `radius-full` now uses 9999px (Tailwind convention)

---

### Sizes (NEW)

**Added:**
```scss
/* Tailwind numeric scale */
--size-0: 0px;
--size-1: 4px;
--size-2: 8px;
--size-3: 12px;
--size-4: 16px;
--size-5: 20px;
--size-6: 24px;
--size-8: 32px;
--size-10: 40px;
--size-12: 48px;
--size-16: 64px;
--size-20: 80px;
--size-24: 96px;
--size-32: 128px;
--size-40: 160px;
--size-48: 192px;
--size-64: 256px;
--size-80: 320px;
--size-96: 384px;

/* Container T-shirt scale */
--size-3xs: 256px;
--size-2xs: 288px;
--size-xs: 320px;
--size-sm: 384px;
--size-md: 448px;
--size-lg: 512px;
--size-xl: 576px;
--size-2xl: 672px;
--size-3xl: 768px;
--size-4xl: 896px;
--size-5xl: 1024px;
--size-6xl: 1152px;
--size-7xl: 1280px;
```

**Impact:**
- ✅ Comprehensive size system
- ✅ Matches `primitives.sizes` tokens exactly
- ✅ Useful for component dimensions, max-widths, etc.

---

## Benefits

### 1. Consistency 🎯
**Problem:** Plugin UI tokens didn't match managed design tokens  
**Solution:** Complete alignment with `sample-tokens.json`

**Example:**
```tsx
// Now consistent everywhere
<div style={{ 
  padding: 'var(--spacing-md)',  // 8px in plugin UI
  borderRadius: 'var(--radius-md)' // 8px in plugin UI
}}>
  // This matches the 8px from primitives.spacing.md
  // This matches the 8px from primitives.radius.md
</div>
```

### 2. Predictability 🔮
Designers and developers can now expect the same spacing/radius values in:
- The plugin UI
- The tokens being imported
- Figma variables created

### 3. Maintainability 🛠️
Single source of truth for design values:
- Update `sample-tokens.json` → update plugin UI accordingly
- No confusion about which spacing scale to use
- Easier onboarding (same system everywhere)

### 4. Documentation by Example 📚
The plugin serves as a live example of the design system:
- Designers see the tokens in action
- Developers understand how to use them
- QA can verify token values visually

---

## Migration Guide

### For Existing Components

Some spacing values changed. Update components if needed:

**Old spacing:**
```scss
padding: var(--spacing-sm); /* was 8px */
margin: var(--spacing-md);  /* was 12px */
gap: var(--spacing-lg);     /* was 16px */
```

**New spacing:**
```scss
padding: var(--spacing-md);  /* now 8px */
margin: var(--spacing-lg);   /* now 12px */
gap: var(--spacing-xl);      /* now 16px */
```

**Radius changes:**
```scss
border-radius: var(--radius-lg); /* was 10px, now 12px */
```

### Component Impact Assessment

Most components should work without changes because:
- The changes are subtle (2-4px differences)
- Visual hierarchy is maintained
- Component spacing is still proportional

**Components to review:**
- [ ] Cards (padding/margin)
- [ ] Buttons (padding)
- [ ] Inputs (padding)
- [ ] Dialogs (spacing)
- [ ] Dropdowns (spacing)

---

## New Capabilities

### Size-based Layout

Can now use the size scale for responsive layouts:

```scss
.container {
  max-width: var(--size-4xl); /* 896px */
  
  @media (max-width: 768px) {
    max-width: var(--size-lg); /* 512px */
  }
}
```

### More Granular Spacing

Finer control over spacing:

```scss
.tight-spacing {
  gap: var(--spacing-2xs); /* 2px - very tight */
}

.normal-spacing {
  gap: var(--spacing-md); /* 8px - comfortable */
}

.loose-spacing {
  gap: var(--spacing-5xl); /* 64px - very loose */
}
```

### Rounded Corners Variety

More radius options:

```scss
.slightly-rounded {
  border-radius: var(--radius-xs); /* 2px */
}

.very-rounded {
  border-radius: var(--radius-2xl); /* 24px */
}

.extremely-rounded {
  border-radius: var(--radius-3xl); /* 32px */
}
```

---

## Token Mapping Reference

### Spacing

| CSS Variable | Value | Matches Token |
|--------------|-------|---------------|
| `--spacing-0` | 0px | `primitives.spacing.0` |
| `--spacing-2xs` | 2px | `primitives.spacing.2xs` |
| `--spacing-xs` | 4px | `primitives.spacing.xs` |
| `--spacing-sm` | 6px | `primitives.spacing.sm` |
| `--spacing-md` | 8px | `primitives.spacing.md` |
| `--spacing-lg` | 12px | `primitives.spacing.lg` |
| `--spacing-xl` | 16px | `primitives.spacing.xl` |
| `--spacing-2xl` | 24px | `primitives.spacing.2xl` |
| `--spacing-3xl` | 32px | `primitives.spacing.3xl` |
| `--spacing-4xl` | 48px | `primitives.spacing.4xl` |
| `--spacing-5xl` | 64px | `primitives.spacing.5xl` |
| `--spacing-6xl` | 96px | `primitives.spacing.6xl` |
| `--spacing-7xl` | 128px | `primitives.spacing.7xl` |

### Radius

| CSS Variable | Value | Matches Token |
|--------------|-------|---------------|
| `--radius-0` | 0px | `primitives.radius.0` |
| `--radius-xs` | 2px | `primitives.radius.xs` |
| `--radius-sm` | 4px | `primitives.radius.sm` |
| `--radius` | 6px | (base) |
| `--radius-md` | 8px | `primitives.radius.md` |
| `--radius-lg` | 12px | `primitives.radius.lg` |
| `--radius-xl` | 16px | `primitives.radius.xl` |
| `--radius-2xl` | 24px | `primitives.radius.2xl` |
| `--radius-3xl` | 32px | `primitives.radius.3xl` |
| `--radius-full` | 9999px | `primitives.radius.full` |

### Sizes

| CSS Variable | Value | Matches Token |
|--------------|-------|---------------|
| `--size-{n}` | Various | `primitives.sizes.{n}` |
| `--size-{t-shirt}` | Various | `primitives.sizes.{t-shirt}` |

(See full mapping in ui.scss)

---

## Best Practices

### 1. Use Semantic Names
```scss
/* ✅ Good - describes intent */
.card-padding { padding: var(--spacing-lg); }
.button-gap { gap: var(--spacing-md); }

/* ❌ Bad - hardcoded values */
.card-padding { padding: 12px; }
.button-gap { gap: 8px; }
```

### 2. Maintain Consistency
```scss
/* ✅ Good - consistent scale */
.small { padding: var(--spacing-sm); }
.medium { padding: var(--spacing-md); }
.large { padding: var(--spacing-lg); }

/* ❌ Bad - arbitrary values */
.small { padding: 5px; }
.medium { padding: 9px; }
.large { padding: 15px; }
```

### 3. Use T-shirt Sizes Appropriately
```scss
/* ✅ Good - use for increasing scale */
--spacing-xs → --spacing-sm → --spacing-md → --spacing-lg

/* ❌ Bad - skipping sizes arbitrarily */
--spacing-xs → --spacing-xl (too big a jump)
```

---

## Future Considerations

### Potential Enhancements
1. **Color Alignment** - Could also align colors with semantic tokens
2. **Typography Tokens** - Add font size/weight tokens from design system
3. **Shadow Tokens** - If elevation system added to sample-tokens
4. **Animation Tokens** - Transition durations and easings

### Maintaining Alignment
When updating `sample-tokens.json`:
1. Review if spacing/radius/sizes changed
2. Update `ui.scss` to match
3. Test plugin UI for visual regressions
4. Update this documentation

---

## Color Mapping Reference

### Semantic Token → Primitive Mapping (Light Mode)

| Semantic Token | Maps To | OKLCH Value | Usage |
|----------------|---------|-------------|-------|
| `--background` | `zinc-50` | `oklch(0.985 0 0)` | Page background |
| `--foreground` | `zinc-950` | `oklch(0.141 0.005 285.823)` | Text color |
| `--card` | `zinc-50` | `oklch(0.985 0 0)` | Card background |
| `--primary` | `emerald-600` | `oklch(0.596 0.145 163.225)` | Brand color |
| `--muted` | `zinc-100` | `oklch(0.967 0.001 286.375)` | Subtle background |
| `--accent` | `zinc-300` | `oklch(0.871 0.006 286.286)` | Accent background |
| `--destructive` | `rose-500` | `oklch(0.645 0.246 16.439)` | Error/delete |
| `--success` | `emerald-500` | `oklch(0.696 0.17 162.48)` | Success state |
| `--warning` | `amber-500` | `oklch(0.769 0.188 70.08)` | Warning state |
| `--info` | `blue-500` | `oklch(0.623 0.214 259.815)` | Info state |
| `--border` | `zinc-200` | `oklch(0.92 0.004 286.32)` | Borders |

### Semantic Token → Primitive Mapping (Dark Mode)

| Semantic Token | Maps To | OKLCH Value | Usage |
|----------------|---------|-------------|-------|
| `--background` | `zinc-950` | `oklch(0.141 0.005 285.823)` | Page background |
| `--foreground` | `zinc-50` | `oklch(0.985 0 0)` | Text color |
| `--card` | `zinc-900` | `oklch(0.21 0.006 285.885)` | Card background |
| `--muted` | `zinc-800` | `oklch(0.274 0.006 286.033)` | Subtle background |
| `--border` | `zinc-800` | `oklch(0.274 0.006 286.033)` | Borders |

(All status colors remain the same in dark mode)

### Color Primitive Scales Available

**Zinc (11 shades):** 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950  
**Emerald (11 shades):** 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950  
**Rose (1 shade):** 500  
**Amber (1 shade):** 500  
**Blue (1 shade):** 500  

**Total:** 25 color primitives → 15+ semantic tokens

---

## Summary

✅ **Colors:** Aligned with primitives + shadcn semantic structure  
✅ **Spacing:** Aligned with primitives (13 tokens)  
✅ **Radius:** Aligned with primitives (10 tokens)  
✅ **Sizes:** Added full Tailwind + container scale (31 tokens)  
✅ **Dark Mode:** Ready for future implementation  
✅ **Documentation:** This guide created  
✅ **Consistency:** Plugin UI now matches design system  

**Total Design Tokens:** 
- 25 color primitives
- 15+ semantic color tokens
- 54 spacing/sizing tokens
- **94+ tokens** total for UI development!

---

**Last Updated:** [Date]  
**Source:** `sample-tokens.json` → `ui.scss`  
**Impact:** All plugin UI components  
**Status:** ✅ Complete

