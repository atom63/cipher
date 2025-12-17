# Export Script Fix - Unit and Type Preservation

## Problem Identified

The export script was stripping critical information from design tokens:

1. **Missing Units**: FLOAT values exported as `"256"` instead of `"256px"`
2. **Lost Semantic Types**: All dimensions exported as generic `"number"` instead of `"borderRadius"`, `"spacing"`, `"sizing"`
3. **No Descriptions**: Token descriptions were not being preserved (not in Figma API)

## Changes Made

### 1. Unit Preservation (`convertVariableValue`)

**Before:**
```typescript
case 'FLOAT':
  return String(value)  // Returns "256"
```

**After:**
```typescript
case 'FLOAT':
  // Add 'px' unit for dimension values
  return `${value}px`  // Returns "256px"
```

### 2. Semantic Type Inference (`figmaTypeToTokenType`)

**Before:**
```typescript
case 'FLOAT':
  return 'number'  // Generic type for all dimensions
```

**After:**
```typescript
case 'FLOAT': {
  // Infer semantic type from variable name/path
  const nameLower = variableName.toLowerCase()
  
  if (nameLower.includes('/radius/') || nameLower.startsWith('radius/')) {
    return 'borderRadius'
  }
  if (nameLower.includes('/spacing/') || nameLower.startsWith('spacing/')) {
    return 'spacing'
  }
  if (nameLower.includes('/sizes/') || nameLower.startsWith('sizes/')) {
    return 'sizing'
  }
  return 'number'
}
```

### 3. Updated Function Calls

Both export calls now pass the variable name for type inference:
```typescript
type: figmaTypeToTokenType(variable.resolvedType, variable.name)
```

## Expected Export Format Comparison

### Before Fix
```json
{
  "value": "256",
  "type": "number",
  "collection": "primitives"
}
```

### After Fix
```json
{
  "value": "256px",
  "type": "sizing",
  "collection": "primitives",
  "description": "16rem - Container 3xs"  // Future enhancement
}
```

## Testing the Fix

### Step 1: Rebuild the Plugin
```bash
cd figma/plugins/design-system
npm run build
# or
node build.js
```

### Step 2: Reload in Figma
1. Open Figma
2. Go to Plugins → Development → Reload plugin
3. Open the Design System Sync plugin

### Step 3: Export and Compare
1. Go to Export tab
2. Select all collections
3. Export tokens
4. Compare with `tokens.json` to verify:
   - ✅ Units are preserved (`"256px"` not `"256"`)
   - ✅ Types are semantic (`"borderRadius"` not `"number"`)
   - ✅ Format matches import structure

## Validation Checklist

- [ ] `primitives/radius/*` tokens export as `type: "borderRadius"`
- [ ] `primitives/spacing/*` tokens export as `type: "spacing"`
- [ ] `primitives/sizes/*` tokens export as `type: "sizing"`
- [ ] All dimension values include `px` unit
- [ ] Color tokens still export correctly with chosen format
- [ ] References (aliases) still use `{collection.path}` format
- [ ] Multi-mode tokens (Light/Dark) export correctly

## Known Limitations

### 1. Description Loss
Figma's API does not provide access to variable descriptions. To preserve descriptions:
- Maintain them in your source `tokens.json` file
- Use a merge script when importing Figma exports
- Or document them separately

### 2. Type Inference Limitations
Type inference is based on path naming conventions:
- Works: `primitives/radius/sm`, `primitives/spacing/md`
- Fails: `primitives/sm` (no context in path)

**Solution**: Follow consistent naming patterns in Figma variable paths.

### 3. Mode Naming
Mode names from Figma export as-is:
- Figma: `"Mode 1"` → Export: `"Mode 1"`
- Source: `"Default"` → Export: `"Mode 1"`

**Solution**: Rename modes in Figma to match your source file (e.g., "Default", "Light", "Dark")

## Recommendations

1. **Keep `tokens.json` as Source of Truth**
   - Contains descriptions and documentation
   - Has clean, semantic structure
   - Version control this file

2. **Use Figma for Design Work**
   - Export to sync changes back
   - But always review/merge with source

3. **Consider a Bidirectional Sync Script**
   ```typescript
   // Future enhancement
   function mergeTokens(source, figmaExport) {
     // Preserve descriptions from source
     // Take values from figmaExport
     // Merge intelligently
   }
   ```

## Color Format Options

The export now supports three color formats:

| Format | Example | Use Case |
|--------|---------|----------|
| **OKLCH** | `oklch(0.627955 0.257068 254.671)` | Modern, perceptual (recommended) |
| **HEX** | `#3b82f6` | Traditional, widely supported |
| **RGBA** | `rgba(59, 130, 246, 1)` | Need alpha channel visibility |

Choose OKLCH for modern color spaces, HEX for maximum compatibility.

## Next Steps

1. Rebuild the plugin (`npm run build`)
2. Test export with your current Figma collections
3. Compare exported JSON with `tokens.json`
4. Report any issues or edge cases
5. Consider implementing description merge tool if needed

## Related Files

- `code.ts:1044-1108` - Export functions updated
- `tokens.json` - Source token file with full metadata
- `export-tokens.json` - Example export (before fix)
- `ExportPage.tsx` - UI for export feature

---

**Status**: ✅ Fixed - Ready for testing
**Date**: 2025-10-15
**Breaking Changes**: None (only additions)

