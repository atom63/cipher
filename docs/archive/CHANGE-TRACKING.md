# Change Tracking Feature

## Overview

The plugin now tracks and displays **exactly what changed** during import operations, especially useful in **Override mode** where you're updating existing design tokens.

---

## 🎯 What Gets Tracked

### **1. Created Tokens**
New variables that were created during the import.
```
✅ primitives/emerald/500 (color) → oklch(0.696 0.17 162.48)
```

### **2. Updated Tokens**
Existing variables whose values changed.
```
🔄 abstractions/primary/500 (reference)
   Old: → primitives/emerald/500
   New: → primitives/blue/500
```

### **3. Unchanged Tokens**
Existing variables whose values stayed the same (tracked but not prominently displayed).

---

## 📊 Display in Override Mode

### **Changes Summary Section**
When using **Override mode**, the success view shows a collapsible "Changes Summary" section:

```
┌──────────────────────────────────────────┐
│ ✅ Override Complete                     │
│                                          │
│ ✅ Success: 185 tokens updated           │
│ ⚠️ Skipped: 15 tokens (not found)       │
├──────────────────────────────────────────┤
│ 📝 Changes Summary (22 updated)         │
│ ▼ Collapsed/Expanded view                │
│                                          │
│ 0 created, 22 updated, 163 unchanged     │
│                                          │
│ Updated Tokens:                          │
│ ┌────────────────────────────────────┐   │
│ │ primitives/emerald/500  [color]    │   │
│ │ oklch(0.696 0.17 162.48)           │   │
│ │      ↓                             │   │
│ │ oklch(0.700 0.175 163.2)          │   │
│ └────────────────────────────────────┘   │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ abstractions/primary/500 [reference]│  │
│ │ → primitives/emerald/500           │   │
│ │      ↓                             │   │
│ │ → primitives/blue/500              │   │
│ └────────────────────────────────────┘   │
│                                          │
│ ... and 18 more changes                  │
└──────────────────────────────────────────┘
```

---

## 🎨 Visual Design

### **Color Coding**
- **Old Value**: Red background (`#fee2e2`) - indicates what was replaced
- **New Value**: Green background (`#dcfce7`) - indicates the new value
- **Arrow**: → separates old from new

### **Token Info Display**
- **Token name**: Monospace font (e.g., `primitives/emerald/500`)
- **Type badge**: Small pill showing token type (color, reference, spacing, etc.)
- **Values**: Monospace font for easy comparison

### **Limits**
- Shows up to **20 changed tokens** by default
- Remaining changes shown as "... and X more changes"
- Prevents UI overload on large imports

---

## 💻 Technical Implementation

### **Backend (code.ts)**

#### **Results Structure**
```typescript
const results = {
  success: 0,
  failed: 0,
  errors: [] as string[],
  skipped: 0,
  changes: [] as Array<{
    name: string           // e.g., "primitives/emerald/500"
    type: string           // e.g., "color", "reference"
    action: 'created' | 'updated' | 'unchanged'
    oldValue?: string      // Old value (if updated)
    newValue: string       // New value
  }>,
}
```

#### **Change Detection Logic**

**For Direct Values:**
```typescript
const oldValue = !isNewVariable ? variable.valuesByMode[modeId] : undefined
const oldValueStr = oldValue !== undefined ? String(oldValue) : undefined
const newValueStr = String(processedValue)

if (isNewVariable) {
  results.changes.push({ action: 'created', ... })
} else if (oldValueStr !== newValueStr) {
  results.changes.push({ action: 'updated', oldValue: oldValueStr, ... })
} else {
  results.changes.push({ action: 'unchanged', ... })
}
```

**For References (Aliases):**
```typescript
const oldRefId = oldValue && typeof oldValue === 'object' && 'id' in oldValue ? oldValue.id : undefined
const newRefId = referencedVariable.id
const oldRefName = oldRefId ? figma.variables.getVariableById(oldRefId)?.name : undefined
const newRefName = referencedVariable.name

if (oldRefId !== newRefId) {
  results.changes.push({
    action: 'updated',
    oldValue: `→ ${oldRefName}`,
    newValue: `→ ${newRefName}`
  })
}
```

---

### **Frontend (ProgressView.tsx)**

#### **Categorization**
```typescript
const changedTokens = changes.filter(c => c.action === 'updated')
const createdTokens = changes.filter(c => c.action === 'created')
const unchangedTokens = changes.filter(c => c.action === 'unchanged')
```

#### **Conditional Display**
```typescript
{isOverrideMode && hasChanges && (
  <details className={styles.changesDetails} open={true}>
    {/* Show changes summary */}
  </details>
)}
```

**Only shows in:**
- ✅ Override mode (`isOverrideMode === true`)
- ✅ When there are actual changes (`changedTokens.length > 0`)

---

## 🔍 Use Cases

### **Scenario 1: Theme Color Switch**

**Action:** Import `sample-tokens-override.json` (changes primary from green → blue)

**Changes Displayed:**
```
Updated Tokens: (11 changes)

abstractions/primary/50  [reference]
  → primitives/emerald/50
        ↓
  → primitives/blue/50

abstractions/primary/100 [reference]
  → primitives/emerald/100
        ↓
  → primitives/blue/100

... and 9 more changes
```

---

### **Scenario 2: Value Refinement**

**Action:** Import adjusted emerald colors (slightly brighter)

**Changes Displayed:**
```
Updated Tokens: (11 changes)

primitives/emerald/500 [color]
  oklch(0.696 0.17 162.48)
        ↓
  oklch(0.700 0.175 163.2)

primitives/emerald/600 [color]
  oklch(0.596 0.145 163.225)
        ↓
  oklch(0.600 0.150 164.5)

... and 9 more changes
```

---

### **Scenario 3: Partial Update**

**Action:** Import `sample-tokens-partial.json` (only 5 tokens)

**Changes Displayed:**
```
Updated Tokens: (5 changes)

primitives/emerald/500 [color]
  oklch(0.696 0.17 162.48)
        ↓
  oklch(0.750 0.190 165.0)

primitives/spacing/md [spacing]
  8
        ↓
  12

... and 3 more changes
```

---

## 🎛️ User Benefits

### **1. Transparency**
- **See exactly what changed** before closing the dialog
- **Confidence** in what was updated vs skipped

### **2. Audit Trail**
- **Review changes** to catch unintended updates
- **Documentation** for design system versioning

### **3. Debugging**
- **Identify** why certain tokens were skipped
- **Verify** that reference updates cascaded correctly

### **4. Learning**
- **Understand** how references work
- **See** the propagation of changes through token layers

---

## 📝 Future Enhancements

### **Potential Features**
1. **Export changes** to JSON/CSV for documentation
2. **Filter changes** by type (color, spacing, references)
3. **Undo specific changes** (selective rollback)
4. **Diff view** with side-by-side comparison
5. **Change history** across multiple imports
6. **Notification** on reference chain updates

---

## 🧪 Testing

### **Test Scenarios**

1. **Override with changes**: Should show changes section
2. **Override with no changes**: Should not show changes section (all unchanged)
3. **Import mode**: Should not show changes section (focused on creation)
4. **Mixed changes**: Some updated, some unchanged - should only show updated
5. **Large change set** (100+ tokens): Should truncate to 20 with "more" indicator
6. **Reference changes**: Should display → arrows correctly

---

## 🎨 CSS Classes

### **Component Styles**
Located in: `components/import/ProgressView.module.css`

- `.changesDetails` - Main container
- `.changesDetailsContent` - Content wrapper
- `.changesSummary` - Blue info box
- `.changesList` - List of changes
- `.changeItem` - Individual change card
- `.changeName` - Token name + type badge
- `.changeValues` - Old/new value display
- `.oldValue` - Old value (red)
- `.newValue` - New value (green)
- `.changeArrow` - Arrow separator

---

## 📦 Data Flow

```
1. User imports tokens in Override mode
      ↓
2. Backend (code.ts) processes tokens
      ↓
3. For each token:
   - Get old value from existing variable
   - Set new value
   - Compare old vs new
   - Add to changes[] array
      ↓
4. Return results with changes[] to UI
      ↓
5. UI (ProgressView.tsx) receives changes
      ↓
6. Filter changes by action type
      ↓
7. Display "Changes Summary" section
      ↓
8. User reviews what changed
```

---

## 🚀 Summary

**This feature provides:**
- ✅ Full transparency in Override operations
- ✅ Detailed before/after comparisons
- ✅ Clear visual distinction between old and new values
- ✅ Efficient display (limited to 20 changes)
- ✅ Context-aware (only shows in Override mode)
- ✅ Professional UX with proper styling

**Users can now confidently use Override mode knowing exactly what will change!**

---

**Last Updated:** 2025-10-14  
**Version:** 1.0.0  
**Status:** ✅ Complete & Tested

