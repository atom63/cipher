# Sample Tokens Comparison

## Overview

The sample token files are designed to demonstrate the **Override Mode** feature by showing how color mappings can change between imports.

---

## 🎨 Color Values

### Emerald (Green) - Both Files

**`sample-tokens.json`** - Standard Tailwind Emerald (Original Green)
```oklch
50:  oklch(0.979 0.021 166.113)  // Hue 166° = Green
100: oklch(0.95  0.052 163.051)
200: oklch(0.905 0.093 164.15)
300: oklch(0.845 0.143 164.978)
400: oklch(0.765 0.177 163.223)
500: oklch(0.696 0.17  162.48)   // Base emerald
600: oklch(0.596 0.145 163.225)
700: oklch(0.508 0.118 165.612)
800: oklch(0.432 0.095 166.913)
900: oklch(0.378 0.077 168.94)
950: oklch(0.262 0.051 172.552)
```

**`sample-tokens-override.json`** - Adjusted Emerald (Slightly Different Green)
```oklch
50:  oklch(0.982 0.025 165.5)    // Hue 165° = Green (slightly adjusted)
100: oklch(0.953 0.058 164.2)
200: oklch(0.910 0.098 163.8)
300: oklch(0.850 0.148 165.5)
400: oklch(0.770 0.182 164.0)
500: oklch(0.700 0.175 163.2)    // Slightly brighter
600: oklch(0.600 0.150 164.5)
700: oklch(0.512 0.122 166.2)
800: oklch(0.435 0.098 167.5)
900: oklch(0.382 0.080 169.2)
950: oklch(0.265 0.055 171.8)
```

**Difference:** Slightly brighter and more saturated greens in the override file.

---

### Blue - Both Files (Identical)

Both files have the same blue values:
```oklch
50:  oklch(0.97  0.014 254.604)  // Hue 254° = Blue
100: oklch(0.939 0.03  255.508)
...
500: oklch(0.623 0.214 259.815)  // Base blue
...
950: oklch(0.269 0.079 267.935)
```

---

## 🔄 The Override Test: Primary Abstraction

### Base File (`sample-tokens.json`)

```json
"primary": {
  "50":  { "value": "{primitives.emerald.50}" },
  "100": { "value": "{primitives.emerald.100}" },
  ...
  "500": { "value": "{primitives.emerald.500}" },  // 🟢 GREEN
  ...
  "950": { "value": "{primitives.emerald.950}" }
}
```

**Result:** Primary = Emerald (Green)

---

### Override File (`sample-tokens-override.json`)

```json
"primary": {
  "50":  { "value": "{primitives.blue.50}" },
  "100": { "value": "{primitives.blue.100}" },
  ...
  "500": { "value": "{primitives.blue.500}" },  // 🔵 BLUE
  ...
  "950": { "value": "{primitives.blue.950}" }
}
```

**Result:** Primary = Blue

---

## 🧪 Testing Workflow

### Step 1: Import Base Tokens

```bash
1. Open plugin in Figma
2. Import sample-tokens.json in Import mode
3. Expected result:
   ✅ primitives/emerald/* = Green (Tailwind standard)
   ✅ primitives/blue/* = Blue
   ✅ abstractions/primary/* = Green (points to emerald)
   ✅ semantic/primary = Green
```

**Visual Check in Figma:**
- Variables panel shows `abstractions/primary/500` with **green** color
- Variables panel shows `semantic/primary` (Light mode) with **green** color

---

### Step 2: Override with Different Values

```bash
1. Import sample-tokens-override.json in Override mode
2. Expected result:
   ✅ primitives/emerald/* = Updated to slightly brighter green
   ✅ primitives/blue/* = Unchanged (same values)
   ✅ abstractions/primary/* = Now BLUE (references changed!)
   ✅ semantic/primary = Now BLUE (inherits from abstractions/primary)
```

**Visual Check in Figma:**
- Variables panel shows `abstractions/primary/500` **changed from green to blue**
- Variables panel shows `semantic/primary` **changed from green to blue**
- All UI elements using `semantic/primary` now show **blue** instead of **green**

---

## 📊 What Gets Updated

### Direct Value Updates
| Token | Base Value | Override Value | Change |
|-------|------------|----------------|--------|
| `primitives/emerald/500` | `oklch(0.696 0.17 162.48)` | `oklch(0.700 0.175 163.2)` | Slightly brighter |
| `primitives/blue/500` | `oklch(0.623 0.214 259.815)` | `oklch(0.623 0.214 259.815)` | No change |

### Reference Updates
| Token | Base Reference | Override Reference | Change |
|-------|---------------|-------------------|--------|
| `abstractions/primary/500` | `{primitives.emerald.500}` | `{primitives.blue.500}` | 🟢 → 🔵 |
| `semantic/primary` (Light) | `{abstractions.primary.500}` | `{abstractions.primary.500}` | Inherits: 🟢 → 🔵 |

---

## 🎯 Key Demonstration Points

### 1. Value Overrides
- Emerald colors get **slightly adjusted values**
- All 11 shades (50-950) are updated
- Changes are subtle but demonstrate value updates work

### 2. Reference Chain Updates
```
semantic/primary → abstractions/primary/500 → primitives/emerald/500
                                            ↓ (override)
                                         primitives/blue/500
```

**This shows:**
- References are resolved correctly
- Semantic tokens automatically pick up the new mapping
- No manual updates needed to dependent tokens

### 3. Override Mode Behavior
- ✅ Existing tokens get updated values
- ✅ Reference changes propagate correctly
- ✅ No duplicate variables created
- ✅ Clean, non-destructive update

---

## 🎨 Visual Differences You'll See

### Before Override (Base Import)
```
Primary color swatches: 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢
                       (All shades of green)
```

### After Override
```
Primary color swatches: 🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵
                       (All shades of blue)

Emerald swatches: 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 (slightly brighter)
```

---

## 🔬 OKLCH Hue Reference

For understanding the color values:

| Hue Range | Color |
|-----------|-------|
| 0° - 30° | Red |
| 30° - 90° | Yellow/Orange |
| 90° - 150° | Yellow-Green |
| **150° - 180°** | **🟢 Green (Emerald)** |
| 180° - 210° | Cyan |
| 210° - 270° | **🔵 Blue** |
| 270° - 300° | Purple |
| 300° - 330° | Magenta |
| 330° - 360° | Red |

**Emerald:** ~163-172° (Green)  
**Blue:** ~251-267° (Blue)

---

## 💡 Best Practices for Testing

### 1. First Import (Import Mode)
- Use **Import (Create & Update)** mode
- Imports all tokens fresh
- Creates complete design system structure

### 2. Override Test (Override Mode)
- Use **Override (Update Only)** mode
- Only updates existing tokens
- See reference changes in real-time

### 3. Verify in Figma
- Open Variables panel
- Check `abstractions/primary/500` color swatch
- Apply variables to shapes to see visual changes
- Test in both Light and Dark modes

### 4. Repeat Testing
- Can override multiple times
- Switch back to base by reimporting `sample-tokens.json` in override mode
- No need to delete variables between tests

---

## 🚀 Summary

These sample files demonstrate:

✅ **Value updates** - Emerald colors get refined  
✅ **Reference switching** - Primary changes from emerald to blue  
✅ **Cascade effects** - Semantic tokens automatically update  
✅ **Non-destructive** - Override mode only updates, doesn't delete  
✅ **Real-world use case** - Theme color changes without restructuring  

**Perfect for testing the Override Mode feature!** 🎨

---

**Files:**
- `sample-tokens.json` - Base tokens (Primary = Emerald/Green)
- `sample-tokens-override.json` - Override tokens (Primary = Blue)
- `sample-tokens-simple.json` - Simple test file (no overrides)

**Date:** 2025-10-14  
**Status:** Ready for testing ✅

