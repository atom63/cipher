# Token Editing Guide

## 🎨 New Editing Features

You can now modify token names and values in the review stage before importing to Figma!

## ✏️ Inline Editing

### Edit Token Names
**Click on any Figma name** (the blue text with ✎ icon) to edit it inline.

**Example:**
```
gray-100 → color/gray/100 ✎
         ↓ (click to edit)
gray-100 → color/neutral/100
```

**How to:**
1. Click the blue Figma name
2. Edit the text
3. Press `Enter` or click outside to save
4. Press `Escape` to cancel

### Edit Token Values
**Click on any value** (color preview or spacing number) to edit it.

**Examples:**
```
Color:   #3B82F6 → (click) → #2563EB
Spacing: 16px    → (click) → 20
```

**How to:**
1. Click the value area
2. Type new value
3. Press `Enter` or click outside to save
4. Press `Escape` to cancel

**Supported formats:**
- Colors: Hex format only (`#3B82F6`, `#f00`, `#ff0000ff`)
- Spacing: Numbers (`16`, `20`, `24`)

---

## 🔍 Batch Rename

### Find & Replace
Click **"🔍 Batch Rename"** button to open the batch rename dialog.

### Use Cases

#### 1. Rename Color Groups
Replace all "gray" with "neutral":

**Input:**
```
Find: gray
Replace: neutral
Scope: All
```

**Result:**
```
gray-100  → neutral-100
gray-200  → neutral-200
color/gray/100 → color/neutral/100
```

#### 2. Change Prefixes
Remove "color-" prefix:

```
Find: color-
Replace: (leave empty)
Scope: Original name only
```

**Result:**
```
color-primary   → primary
color-secondary → secondary
```

#### 3. Update Paths
Change path structure:

```
Find: color/brand
Replace: color/theme
Scope: Figma path only
```

**Result:**
```
color/brand/primary   → color/theme/primary
color/brand/secondary → color/theme/secondary
```

### Scope Options

**All (default)**
- Affects both original name AND Figma path
- Most comprehensive rename

**Original name only**
- Only changes the source token name
- Figma path stays the same

**Figma path only**
- Only changes the Figma variable path
- Original name stays the same

---

## 💡 Common Editing Patterns

### Pattern 1: Standardize Naming

**Before import:**
```json
{
  "colors": {
    "primary-color": "#3B82F6",
    "secondary-col": "#10B981"
  }
}
```

**Use batch rename:**
- Find: `-color`
- Replace: (empty)
- Result: Clean names like `primary`, `secondary`

### Pattern 2: Group Reorganization

**Change color organization:**
```
Find: color/gray
Replace: color/neutral
```

All gray colors become neutral colors.

### Pattern 3: Prefix/Suffix Management

**Add semantic prefixes:**
```
Find: primary
Replace: brand-primary
```

**Remove suffixes:**
```
Find: -1
Replace: (empty)
```

### Pattern 4: Case Conversion

**Lowercase everything:**
```
Find: BLUE
Replace: blue
```

---

## 🎯 Best Practices

### 1. Review Before Batch Operations
- Check the example preview in the dialog
- Start with a small test
- You can always undo by canceling import

### 2. Use Specific Find Terms
- Be specific to avoid unintended changes
- `gray-` is better than `gray` if you only want prefixed items

### 3. Incremental Editing
- Make one batch change at a time
- Review the results
- Then make the next change

### 4. Combine Inline + Batch
- Use batch rename for groups
- Use inline editing for individual tweaks

---

## 🔧 Advanced Workflows

### Workflow 1: Brand Color Migration
You're rebranding from "blue" to "primary":

1. **Batch rename** - Find: `blue` → Replace: `primary`
2. **Inline edit** - Fine-tune specific shades
3. **Review** - Check all mappings
4. **Import** - Create variables

### Workflow 2: Design System Alignment
Aligning your tokens with a standard:

1. **Import** your current tokens
2. **Batch rename** color groups:
   - `gray` → `neutral`
   - `red` → `danger`
   - `green` → `success`
3. **Inline edit** specific values to match standards
4. **Import** aligned tokens

### Workflow 3: Nested Structure
Creating a nested hierarchy:

1. Import flat tokens
2. **Batch rename** to add hierarchy:
   - Find: `color/` → Replace: `color/semantic/`
3. **Inline edit** to organize further
4. Import with new structure

---

## 📝 Examples

### Example 1: Full Color System Rename

**Tokens:**
```json
{
  "colors": {
    "gray-50": "#F9FAFB",
    "gray-100": "#F3F4F6",
    "gray-900": "#111827"
  }
}
```

**Step 1:** Batch rename gray → neutral
**Step 2:** Inline edit paths to match design system
**Step 3:** Result:
```
color/neutral/50
color/neutral/100
color/neutral/900
```

### Example 2: Spacing Adjustment

**Tokens:**
```json
{
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16
  }
}
```

**Step 1:** Inline edit values to use 8px grid
- 4 → 8
- 8 → 16
- 16 → 24

**Step 2:** Import adjusted values

---

## ⚠️ Important Notes

### Value Validation
- **Colors**: Must be valid hex format
  - ✅ `#3B82F6`, `#f00`, `#FF0000FF`
  - ❌ `rgb(59, 130, 246)`, `blue`, `hsl(217, 91%, 60%)`
  
- **Spacing**: Must be numbers
  - ✅ `16`, `20`, `1.5`
  - ❌ `16px`, `1rem`, `auto`

### Name Constraints
- Figma variable names must be unique
- Avoid special characters: `/ . - _` are okay
- Case sensitive

### Changes Not Permanent
- All edits happen before import
- You can cancel anytime
- Original file is never modified
- Only affects what gets imported to Figma

---

## 🚀 Quick Reference

| Action | How To | Shortcut |
|--------|--------|----------|
| Edit name | Click blue name | - |
| Edit value | Click value/color | - |
| Save edit | Click outside | `Enter` |
| Cancel edit | - | `Escape` |
| Batch rename | Click button | - |
| Undo changes | Cancel import | - |

---

## 💬 Tips

1. **Test with small batches first** - Import a few tokens to test
2. **Use descriptive names** - Future you will thank you
3. **Follow conventions** - Match your team's naming standards
4. **Document patterns** - Keep a guide for your design system
5. **Iterate** - Import, test, adjust, re-import

---

**Happy editing! 🎨**

