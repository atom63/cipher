# Override Mode Feature

## Overview

The plugin now supports two distinct modes for handling design tokens:

### **Import Mode** (Default)
- Creates new variables
- Updates existing variables
- **Errors** on missing tokens or references
- Use for: Initial imports, adding new tokens

### **Override Mode** (New!)
- **Only updates** existing variables
- **Silently skips** tokens that don't exist
- **Silently skips** missing references
- Use for: Updating values of existing tokens

---

## How It Works

### User Interface

When selecting a collection, users now see:

```
Action Type
Choose how to handle these tokens

○ Import (Create & Update)
  Create new variables and update existing ones. Errors if references are missing.

● Override (Update Only)
  Only update existing variables. Silently skips missing tokens and references.
```

### Backend Behavior

#### Import Mode
```typescript
if (!existingVariable) {
  // Create new variable
  variable = figma.variables.createVariable(...)
} else {
  // Update existing variable
  variable.setValueForMode(...)
}

if (!referencedToken) {
  // ❌ ERROR: Reference not found
  throw error
}
```

#### Override Mode
```typescript
if (!existingVariable) {
  // ⚠️ SKIP: Variable doesn't exist
  results.skipped++
  continue
} else {
  // ✅ UPDATE: Variable exists
  variable.setValueForMode(...)
}

if (!referencedToken) {
  // ⚠️ SKIP: Reference not found
  results.skipped++
  continue
}
```

---

## Use Cases

### 1. Testing Color Variations

**Scenario:** You have emerald colors (green-ish) and want to test different OKLCH values (blue-ish).

**Steps:**
1. Import `sample-tokens.json` in **Import mode** → Creates all tokens
2. Modify emerald colors in `sample-tokens-override.json`
3. Import `sample-tokens-override.json` in **Override mode** → Only updates emerald values
4. Missing blue references? No problem - they're skipped!

**Result:** Only emerald colors updated, everything else unchanged.

---

### 2. Partial Token Updates

**Scenario:** You have 300 tokens in Figma, but only want to update 20 spacing values.

**Steps:**
1. Create a JSON file with just the 20 spacing tokens
2. Import in **Override mode**
3. Plugin only updates those 20 tokens

**Result:** Fast, targeted updates without recreating everything.

---

### 3. Environment-Specific Overrides

**Scenario:** Different color values for dev/staging/production.

**Steps:**
1. Import base tokens (`base-tokens.json`) in **Import mode**
2. Import production overrides (`prod-colors.json`) in **Override mode**
3. Only color values change, structure remains intact

**Result:** Environment-specific theming without duplication.

---

## UI Feedback Differences

### Import Mode Results

```
✅ Successfully imported: 245 tokens
❌ Failed: 17 tokens

Error Summary:
• 17 reference errors (token not found)

Detailed Errors:
❌ "abstractions/primary/50" - Referenced token not found: "primitives/blue/50". 
   Make sure the referenced token exists and was imported first.
```

### Override Mode Results

```
✅ Successfully overridden: 95 tokens
⚠️ Skipped: 17 tokens (tokens or references not found)

Skip Summary:
• 17 reference errors (token not found)

Skipped Tokens:
⚠️ "abstractions/primary/50" - Skipped (override mode): Referenced token not found: "primitives/blue/50".
⚠️ "primitives/emerald/500" - Skipped (override mode): Variable doesn't exist in Figma.
```

**Key Differences:**
- Icon changes: ❌ → ⚠️
- Title changes: "Import Failed" → "Override Completed with Warnings"
- Error → Warning language
- "Failed" → "Skipped"
- Less alarming tone

---

## Technical Implementation

### Files Changed

1. **`CollectionSelector.tsx`**
   - Added `importMode` state
   - Added "Action Type" radio group
   - Passes `importMode` to parent

2. **`ImportPage.tsx` & `LibraryPage.tsx`**
   - Store `importMode` in state
   - Pass `importMode` to backend
   - Pass `importMode` to SuccessView

3. **`ProgressView.tsx`**
   - Accepts `importMode` prop
   - Dynamic text: "Import" vs "Override"
   - Dynamic colors: Red errors vs Yellow warnings
   - Dynamic icons: ❌ vs ⚠️

4. **`code.ts`**
   - Accepts `importMode` parameter
   - Checks `if (isOverrideMode)` before creating variables
   - Skips non-existent tokens in override mode
   - Skips missing references in override mode
   - Tracks `skipped` count separately

---

## API Changes

### Message Format

```typescript
// Before
{
  type: 'create-variables',
  data: {
    tokens: DesignToken[],
    collectionName: string
  }
}

// After
{
  type: 'create-variables',
  data: {
    tokens: DesignToken[],
    collectionName: string,
    importMode: 'import' | 'override'  // ← New!
  }
}
```

### Results Format

```typescript
// Before
{
  success: number,
  failed: number,
  errors: string[]
}

// After
{
  success: number,
  failed: number,
  errors: string[],
  skipped: number  // ← New!
}
```

---

## Testing Scenarios

### ✅ Test 1: Override with Missing Tokens
1. Import 100 tokens in Import mode
2. Create JSON with 50 tokens (25 exist, 25 don't)
3. Import in Override mode
4. **Expected:** 25 updated, 25 skipped, 0 errors

### ✅ Test 2: Override with Missing References
1. Import tokens with references
2. Delete some primitive tokens
3. Try to override semantic tokens that reference deleted primitives
4. **Expected:** Skipped (not error)

### ✅ Test 3: Mixed Mode Workflow
1. Import base in Import mode
2. Override colors in Override mode
3. Import new spacing in Import mode
4. **Expected:** All operations succeed

---

## Best Practices

### When to Use Import Mode
- ✅ First-time token import
- ✅ Adding new tokens
- ✅ Want errors for missing references
- ✅ Building complete design system

### When to Use Override Mode
- ✅ Testing color variations
- ✅ Updating existing values only
- ✅ Partial/incremental updates
- ✅ Don't care about missing tokens
- ✅ Environment-specific overrides

---

## Console Logging

Both modes log detailed information:

```javascript
// Import mode
console.log('Import completed:', {
  success: 245,
  failed: 17,
  skipped: 0,
  totalErrors: 17
})

// Override mode
console.log('Override completed:', {
  success: 95,
  failed: 0,
  skipped: 17,
  totalErrors: 17
})
```

---

## Future Enhancements

Potential improvements:

1. **Preview Mode** - Show what would be updated before committing
2. **Selective Override** - Choose which tokens to override in UI
3. **Diff View** - Show old vs new values before override
4. **Backup/Restore** - Undo overrides
5. **Batch Operations** - Override multiple files in sequence

---

## Summary

Override mode makes the plugin more flexible and user-friendly:

- ✅ Non-destructive updates
- ✅ No errors for missing tokens
- ✅ Perfect for iterative design work
- ✅ Clear visual feedback
- ✅ Faster than reimporting everything

**Use Import mode for structure, Override mode for values!** 🎨

---

**Date:** 2025-10-14  
**Status:** Complete ✅  
**Version:** 1.1.0

