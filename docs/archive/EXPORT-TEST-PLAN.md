# Export Fix Test Plan

## Quick Start

### 1. Rebuild the Plugin
```bash
cd figma/plugins/design-system
node build.js
```

This will:
- Compile `code.ts` → `dist/code.js` (with export fixes)
- Compile `ui.tsx` → `dist/ui.js`
- Compile `ui.scss` → `dist/ui.css`
- Generate `dist/ui.html` (inlined JS & CSS)

### 2. Reload in Figma
1. Open Figma Desktop app
2. Go to **Plugins** → **Development** → **ATOM63 Design System Sync**
3. If already open, close it
4. Right-click → **Run** (or just reopen it)

### 3. Test Export

#### A. Export with Default Settings (OKLCH)
1. Open the plugin
2. Go to **Export** tab
3. Select all collections (should auto-select)
4. Keep color format as **OKLCH** (default)
5. Click **Export**
6. Save as `test-export-oklch.json`

#### B. Export with HEX Format
1. Select **HEX** format
2. Click **Export**  
3. Save as `test-export-hex.json`

## Verification Tests

### Test 1: Unit Preservation
**File**: `test-export-hex.json` or `test-export-oklch.json`

Find a dimension token (radius, spacing, or size):
```json
"primitives": {
  "radius": {
    "md": {
      "value": "8px",  // ✅ Should have 'px' unit
      "type": "borderRadius",
      "collection": "primitives"
    }
  }
}
```

❌ **Fail**: `"value": "8"` (no unit)  
✅ **Pass**: `"value": "8px"` (has unit)

### Test 2: Semantic Types
**File**: Same file

Check different dimension tokens:

```json
"primitives": {
  "radius": {
    "sm": {
      "value": "4px",
      "type": "borderRadius"  // ✅ Should be "borderRadius", not "number"
    }
  },
  "spacing": {
    "md": {
      "value": "8px",
      "type": "spacing"  // ✅ Should be "spacing", not "number"
    }
  },
  "sizes": {
    "4": {
      "value": "16px",
      "type": "sizing"  // ✅ Should be "sizing", not "number"
    }
  }
}
```

❌ **Fail**: All dimensions have `"type": "number"`  
✅ **Pass**: Each dimension has correct semantic type

### Test 3: Color Format
**File**: Compare `test-export-oklch.json` vs `test-export-hex.json`

#### OKLCH Export
```json
"primitives": {
  "zinc": {
    "50": {
      "value": "oklch(0.985661 0.000000 0.000000)",
      "type": "color"
    }
  }
}
```

#### HEX Export
```json
"primitives": {
  "zinc": {
    "50": {
      "value": "#fafafa",
      "type": "color"
    }
  }
}
```

✅ **Pass**: Color format matches selection

### Test 4: References (Aliases)
**File**: Check abstractions or semantics collection

```json
"abstractions": {
  "surface": {
    "50": {
      "value": "{primitives.zinc.50}",  // ✅ Reference format
      "type": "color",
      "collection": "abstractions"
    }
  }
}
```

✅ **Pass**: References use `{collection.path}` format

### Test 5: Multi-Mode Tokens
**File**: Check semantics collection

```json
"semantics": {
  "background": {
    "type": "color",
    "collection": "semantics",
    "modes": {
      "Light": "{abstractions.surface.100}",
      "Dark": "{abstractions.surface.950}"
    }
  }
}
```

✅ **Pass**: Multi-mode tokens have `modes` object with Light/Dark values

## Comparison Test

### Compare with Source File

Run this manual comparison:

```bash
# Open both files side-by-side
code figma/plugins/design-system/tokens.json
code figma/plugins/design-system/test-export-hex.json
```

**Check:**
1. Structure matches (collections, nesting)
2. Units are preserved in export
3. Types match source file
4. Values are consistent (allowing for format conversion)

### Known Differences (Expected)

| Aspect | tokens.json | export-tokens.json | Expected? |
|--------|-------------|-------------------|-----------|
| Descriptions | Has descriptions | Missing descriptions | ✅ Yes (Figma API limitation) |
| Mode names | "Default" | "Mode 1" | ⚠️ Rename in Figma |
| Order | Alphabetical | Alphabetical | ✅ Yes |

## Edge Cases to Test

### 1. Empty Collections
- What happens if a collection has no variables?
- Should skip gracefully

### 2. Mixed Types
- Collection with colors AND dimensions
- Both should export correctly

### 3. Deep Nesting
- `primitives/sizes/containers/3xs`
- Should handle multi-level paths

### 4. Special Characters
- Variable names with numbers, hyphens
- Should export without issues

## Success Criteria

- [x] Units preserved (`"8px"` not `"8"`)
- [x] Semantic types inferred correctly
- [x] Color format selection works
- [x] References maintain `{path}` format
- [x] Multi-mode tokens export with modes object
- [x] No crashes or errors during export
- [x] File downloads successfully
- [x] JSON is valid and parseable

## If Tests Fail

### Issue: No units on dimensions
**Solution**: Check `convertVariableValue` function in `code.ts:1063-1065`

### Issue: All types are "number"
**Solution**: Check `figmaTypeToTokenType` function in `code.ts:1076-1108`

### Issue: Can't find variable name
**Solution**: Verify function signature includes `variableName` parameter at line 1076

### Issue: Build errors
**Solution**: 
```bash
# Check for TypeScript errors
cd figma/plugins/design-system
node build.js
# Look for any compilation errors
```

## Report Results

After testing, document:

1. ✅ All tests passed
2. ⚠️ Some issues found (describe)
3. 🔧 Edge cases discovered

---

**Last Updated**: 2025-10-15  
**Related**: EXPORT-FIX.md

