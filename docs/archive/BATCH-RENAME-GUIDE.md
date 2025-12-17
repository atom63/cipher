# 🔄 Enhanced Batch Rename Guide

## Overview
The batch rename dialog now shows you **exactly what tokens you have** and provides a **live preview** of changes before you apply them.

## Features

### 📋 Token Reference Panel (Right Side)
When the dialog opens, you'll see all your tokens organized by category:

```
Your Tokens
├─ colors (10)
│  ├─ gray-50 → color/gray/50
│  ├─ gray-100 → color/gray/100
│  └─ ... (expandable)
│
└─ spacing (5)
   ├─ space-xs → spacing/xs
   └─ space-sm → spacing/sm
```

**Benefits:**
- See what tokens exist without switching views
- Browse by category (colors, spacing, etc.)
- View both original names and Figma paths
- Categories are collapsible for better organization

### 🔍 Live Preview (When Searching)
As soon as you type in "Find", the right panel transforms into a live preview:

```
Find: gray
Replace: neutral

Preview Changes:
✅ gray-50 → color/gray/50
   ↓
   neutral-50 → color/neutral/50

✅ gray-100 → color/gray/100
   ↓
   neutral-100 → color/neutral/100

⚪ blue-100 → color/blue/100
   (unchanged - no match)
```

**Benefits:**
- Instant feedback on what will change
- See changed items first, then unchanged
- Preview shows up to 15 items
- Counter shows total affected tokens

### 💡 Affected Counter
Shows exactly how many tokens will be modified:

```
✨ Will affect 8 tokens
```

## Usage Examples

### Example 1: Rename Color Prefix
**Goal:** Change `gray` to `neutral`

1. Open batch rename dialog
2. Browse tokens in the reference panel → see you have `gray-50`, `gray-100`, etc.
3. Type "gray" in Find
4. Type "neutral" in Replace
5. See live preview: ✨ Will affect 8 tokens
6. Click Apply

### Example 2: Fix Path Structure
**Goal:** Change `color` to `colors` in Figma paths

1. Open batch rename dialog
2. Select "Figma path only" scope
3. Type "color/" in Find
4. Type "colors/" in Replace
5. Preview shows: `color/gray/50` → `colors/gray/50`
6. Click Apply

### Example 3: Explore Before Editing
**Goal:** See what tokens you have, then decide what to rename

1. Open batch rename dialog
2. Expand categories in the reference panel
3. Notice you have both `space-` and `spacing-` prefixes
4. Decide to standardize to `space-`
5. Find: "spacing-"
6. Replace: "space-"
7. Preview confirms 3 tokens will change
8. Click Apply

## Pro Tips

1. **Browse First**: Open the dialog just to browse your tokens by category
2. **Test Your Regex**: The Find field supports regex patterns (case-insensitive)
3. **Check Preview**: Always verify the preview before clicking Apply
4. **Use Scope**: Narrow scope to "Original name" or "Figma path" for precise edits
5. **Batch Operations**: The counter shows how many tokens you're affecting at once

## Technical Details

- **Search**: Case-insensitive, supports regex
- **Preview Limit**: Shows up to 15 items (changed items first)
- **Token Limit**: Reference panel shows up to 10 tokens per category
- **Performance**: All preview calculations happen in real-time using React hooks

## What Changed?

### Before
- Basic find/replace form
- No way to see existing tokens
- No preview of changes
- Had to remember token names

### After
- **Split view**: Form on left, reference/preview on right
- **Token browser**: See all tokens grouped by category
- **Live preview**: Real-time preview of changes
- **Affected counter**: Know exactly how many tokens will change
- **Smart sorting**: Changed items shown first in preview

---

**Next Steps:**
- Try it in Figma!
- Experiment with different scopes (All, Original name, Figma path)
- Use the reference panel to explore your design tokens

