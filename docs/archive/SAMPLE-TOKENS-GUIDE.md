# Sample Tokens Testing Guide

## Overview

We provide multiple sample token files to test different scenarios and features of the plugin.

---

## 📁 Available Sample Files

### 1. **`sample-tokens.json`** ✅
**Purpose:** Complete, valid design system (Base)

**Contents:**
- Primitives: zinc, emerald (green), blue, rose, amber
- Spacing, sizing, radius scales
- Abstractions: surface, primary (→ emerald)
- Semantic tokens with Light/Dark modes

**Use For:**
- Initial import testing
- Complete design system setup
- Reference for correct token structure

**Expected Result:** All tokens import successfully (200+ tokens)

---

### 2. **`sample-tokens-override.json`** ✅
**Purpose:** Override testing (Green → Blue theme switch)

**Contents:**
- Same structure as base file
- Emerald colors: Slightly brighter green values
- Primary abstraction: Changed from emerald → blue

**Use For:**
- Testing override mode
- Demonstrating reference chain updates
- Theme switching scenarios

**Expected Result:** 
- Import mode: All tokens succeed
- Override mode: Updates existing tokens (emerald values + primary reference)

---

### 3. **`sample-tokens-simple.json`** ✅
**Purpose:** Minimal test file

**Contents:**
- Single collection: "design-tokens"
- Basic colors (brand, neutral, semantic)
- Basic spacing (xs to xl)

**Use For:**
- Quick testing
- Learning token structure
- Minimal viable design system

**Expected Result:** ~20 tokens import successfully

---

### 4. **`sample-tokens-errors.json`** ⚠️
**Purpose:** Error handling and validation testing

**Contents:**
- ❌ Invalid token types (shadow, gradient, animation)
- ❌ Invalid color formats (#GGGGGG, bad OKLCH)
- ❌ Missing references
- ❌ Invalid number formats
- ❌ Circular references
- ✅ One valid color (for comparison)

**Use For:**
- Testing error messages
- Validating parser robustness
- Ensuring graceful failure

**Expected Result:** 
- Import mode: 1 success, ~15 failures
- Clear error messages for each failure
- Plugin doesn't crash

---

### 5. **`sample-tokens-partial.json`** 🔄
**Purpose:** Partial/incremental update testing

**Contents:**
- Only 5 tokens (emerald/500, emerald/600, spacing md/lg/xl)
- Missing most of the design system

**Use For:**
- Testing override mode with missing tokens
- Demonstrating selective updates
- Incremental design changes

**Expected Result:**
- Import mode: 5 tokens created
- Override mode (after full import): 5 updated, rest skipped silently

---

### 6. **`sample-tokens-warnings.json`** ⚠️
**Purpose:** Edge case testing

**Contents:**
- Extreme color values (very bright/dark)
- Extreme spacing values (0.5px, 9999px)
- Very long token names
- Special characters in names

**Use For:**
- Testing boundary conditions
- UI display edge cases
- Name validation

**Expected Result:** All import successfully but may look unusual

---

### 7. **`sample-tokens-mixed-modes.json`** 🌓
**Purpose:** Multiple theme mode testing

**Contents:**
- 3 modes: Light, Dark, High Contrast
- 4 semantic tokens per mode (background, foreground, primary, border)

**Use For:**
- Testing 3+ mode support
- Multi-theme design systems
- Mode switching

**Expected Result:** 1 collection with 3 modes created

---

### 8. **`sample-tokens-type-conflict.json`** ⚠️
**Purpose:** Type conflict testing

**Contents:**
- emerald/500 as SPACING (conflict with COLOR)
- spacing/md as COLOR (conflict with SPACING)
- radius/md as STRING (conflict with FLOAT)

**Use For:**
- Testing type mismatch detection
- Override mode type validation
- Error message clarity

**Expected Result:**
- Import mode: Creates tokens (if none exist)
- Override mode (after sample-tokens.json): 3 type conflicts, all skipped with clear errors

---

## 🧪 Testing Workflows

### Workflow 1: Happy Path
```bash
1. Import sample-tokens.json (Import mode)
   → ✅ 200+ tokens created

2. Import sample-tokens-override.json (Override mode)
   → ✅ Emerald values updated, Primary → Blue

3. Import sample-tokens-override.json again (Override mode)
   → ✅ Idempotent, no changes

4. Import sample-tokens.json (Override mode)
   → ✅ Revert: Primary → Green again
```

### Workflow 2: Error Handling
```bash
1. Import sample-tokens-errors.json (Import mode)
   → ⚠️ 1 success, ~15 failures
   → ✅ Clear error messages
   → ✅ Plugin doesn't crash

2. Check Error Summary:
   → Should categorize errors by type
   → Should show specific token names
   → Should provide solutions
```

### Workflow 3: Partial Override
```bash
1. Import sample-tokens.json (Import mode)
   → ✅ 200+ tokens created

2. Import sample-tokens-partial.json (Override mode)
   → ✅ 5 tokens updated
   → ⚠️ 195+ tokens skipped (not in file)
   → ✅ No errors, just skips

3. Verify in Figma:
   → emerald/500 has new value
   → spacing/md has new value
   → All other tokens unchanged
```

### Workflow 4: Type Conflicts
```bash
1. Import sample-tokens.json (Import mode)
   → ✅ All tokens created (emerald/500 = COLOR)

2. Import sample-tokens-type-conflict.json (Import mode)
   → ⚠️ 3 type conflicts detected
   → ✅ Clear error: "emerald/500 exists as COLOR, trying to import as SPACING"
   → ✅ Tokens skipped, no corruption
```

### Workflow 5: Multi-Mode Testing
```bash
1. Import sample-tokens-mixed-modes.json (Import mode)
   → ✅ 1 collection with 3 modes created
   → ✅ Each mode has different values

2. Switch modes in Figma:
   → Light: White background, black text
   → Dark: Dark background, white text
   → High Contrast: Black/white extremes
```

---

## 📊 Expected Results Summary

| File | Tokens | Success | Failures | Use Case |
|------|--------|---------|----------|----------|
| `sample-tokens.json` | 200+ | 200+ | 0 | Base import |
| `sample-tokens-override.json` | 200+ | 200+ | 0 | Override test |
| `sample-tokens-simple.json` | 20 | 20 | 0 | Quick test |
| `sample-tokens-errors.json` | 16 | 1 | 15 | Error handling |
| `sample-tokens-partial.json` | 5 | 5 | 0 | Partial override |
| `sample-tokens-warnings.json` | 12 | 12 | 0 | Edge cases |
| `sample-tokens-mixed-modes.json` | 4 | 4 | 0 | Multi-mode |
| `sample-tokens-type-conflict.json` | 3 | 0 | 3 | Type conflicts |

---

## 🎯 Testing Checklist

### Basic Functionality
- [ ] Import base tokens successfully
- [ ] Override tokens update values
- [ ] Reference chains work correctly
- [ ] Modes are created properly

### Error Handling
- [ ] Invalid types show clear errors
- [ ] Invalid formats show clear errors
- [ ] Missing references handled gracefully
- [ ] Type conflicts detected and prevented

### Override Mode
- [ ] Existing tokens updated
- [ ] Missing tokens skipped (not errored)
- [ ] Reference changes propagate
- [ ] Idempotent (can run multiple times)

### Edge Cases
- [ ] Very long names work
- [ ] Special characters work
- [ ] Extreme values work
- [ ] Multiple modes work

### UI/UX
- [ ] Error summary is helpful
- [ ] Categorized errors
- [ ] Success/skip counts accurate
- [ ] No crashes or freezes

---

## 💡 Pro Tips

### 1. Start Simple
Begin with `sample-tokens-simple.json` to understand the basics.

### 2. Use Import Mode First
Always do the first import in **Import mode** to create the structure.

### 3. Test Overrides
Use **Override mode** for subsequent imports to test update behavior.

### 4. Check Console
Open Figma's Dev Console (Help → Show/Hide Console) for detailed logs.

### 5. Compare in Figma
After each import, check the Variables panel to see actual changes.

### 6. Test Both Modes
Every test file should be tried in both Import and Override modes.

---

## 🚨 Known Issues to Test

1. **Circular References**: Currently not detected, will cause infinite loops
2. **Large Files**: Test with 1000+ tokens to check performance
3. **Unicode Characters**: Test tokens with emoji, Chinese characters, etc.
4. **Duplicate Names**: Two tokens with same path but different values

---

## 📝 Creating Your Own Test Files

### Minimal Structure
```json
{
  "$schema": "design-tokens-with-collections",
  "$version": "1.0",
  "$collections": {
    "my-collection": {
      "name": "My Test Collection",
      "description": "Testing something specific",
      "order": 1,
      "modes": ["Default"]
    }
  },
  "tokens": {
    "my-collection": {
      "my-token": {
        "value": "oklch(0.5 0.1 200)",
        "type": "color",
        "collection": "my-collection"
      }
    }
  }
}
```

### With References
```json
{
  "tokens": {
    "primitives": {
      "blue-500": { "value": "oklch(0.623 0.214 259.815)", "type": "color" }
    },
    "semantic": {
      "primary": { "value": "{primitives.blue-500}", "type": "color" }
    }
  }
}
```

### With Modes
```json
{
  "tokens": {
    "semantic": {
      "background": {
        "type": "color",
        "modes": {
          "Light": "oklch(1 0 0)",
          "Dark": "oklch(0 0 0)"
        }
      }
    }
  }
}
```

---

## 🔗 Related Documentation

- **[Override Mode Guide](OVERRIDE-MODE.md)** - How override mode works
- **[Error Messaging](ERROR-MESSAGING-IMPROVEMENTS.md)** - Understanding error messages
- **[Token Comparison](SAMPLE-TOKENS-COMPARISON.md)** - Base vs Override differences

---

**Date:** 2025-10-14  
**Status:** Complete testing suite ✅  
**Files:** 8 sample token files covering all scenarios

