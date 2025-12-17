# Phase 1: Library Presets - Testing Guide

## ✅ What's New in Phase 1

### 🎨 Library Selection Screen
- Welcome screen with 4 options:
  - **Radix Colors** (Popular) - 300+ tokens
  - **Tailwind CSS** (Popular) - 335+ tokens
  - **Custom Palette** (Coming Soon)
  - **Import JSON** (Existing flow)

### 🌈 Radix Colors Integration
- Select from 30+ color palettes
- Organized by category (Gray Scales + Colors)
- Light + Dark mode support
- 12 shades per palette (1-12)
- Checkbox selection with Select All/Clear options
- Live token count preview

### 🎨 Tailwind CSS Integration
- Select from 4 token categories:
  - **Colors** - All 22 Tailwind palettes (242 tokens)
  - **Spacing** - Full spacing scale (37 tokens)
  - **Font Sizes** - Typography scale (13 tokens)
  - **Border Radius** - Radius values (8 tokens)
- Card-based selection UI
- Live token count preview

---

## 🧪 Testing Steps

### Test 1: Library Selection Screen

1. Open Figma Desktop App
2. Run **Plugins → Development → ATOM63 Design System Sync**
3. Verify you see the **Library Selection** screen with 4 cards
4. Hover over each card - should show hover effects
5. "Custom Palette" should show "Coming Soon" and be disabled

✅ **Expected**: Clean, modern selection screen with working interactions

---

### Test 2: Radix Colors Flow

#### 2.1 Select Radix
1. Click **"Radix Colors"** card
2. Verify you're on the Radix selector screen

#### 2.2 Select Palettes
1. By default, **Blue** and **Slate** should be selected
2. **"Include dark mode palettes"** should be checked
3. Token count should show: **48 tokens ready** (2 palettes × 12 shades × 2 modes)

#### 2.3 Change Selection
1. Click **"Select all"** under **Gray Scales**
   - Should select: Gray, Mauve, Slate, Sage, Olive, Sand
   - Token count updates
2. Click **"Clear"** under **Gray Scales**
   - All grays deselected
   - Token count updates

#### 2.4 Test Dark Mode Toggle
1. Uncheck **"Include dark mode palettes"**
   - Token count should halve (only light mode)
2. Re-check it
   - Token count doubles (light + dark)

#### 2.5 Generate Preview
1. Select **Blue, Slate, Green** palettes
2. Keep dark mode enabled
3. Should show: **72 tokens ready** (3 × 12 × 2)
4. Click **"Preview 72 Tokens →"**

#### 2.6 Review Tokens
1. Should go to **Collection Selector** screen
2. Verify 72 tokens are listed
3. Check token names follow pattern: `radix/blue/1`, `radix/blue/dark/1`, etc.
4. Color tokens should show color swatches
5. Continue to import...

✅ **Expected**: Smooth flow from palette selection to token preview

---

### Test 3: Tailwind CSS Flow

#### 3.1 Select Tailwind
1. From library screen, click **"Tailwind CSS"** card
2. Verify you're on the Tailwind selector screen

#### 3.2 Category Selection (Default)
1. By default, **Colors** and **Spacing** should be selected
2. Token count should show the sum

#### 3.3 Select All Categories
1. Check all 4 categories:
   - ☑ Colors
   - ☑ Spacing
   - ☑ Font Sizes
   - ☑ Border Radius
2. Token count should show: **300 tokens ready**

#### 3.4 Test Individual Category
1. Click **"Clear"**
2. Select **only Colors**
3. Should show: **242 tokens ready**
4. Verify the info box shows the tip about rem → px conversion

#### 3.5 Generate Preview
1. Select **Colors** + **Spacing**
2. Click **"Preview X Tokens →"**

#### 3.6 Review Tokens
1. Should go to **Collection Selector** screen
2. Verify tokens follow pattern: `tw/slate/50`, `tw/spacing/4`, etc.
3. Color tokens show swatches
4. Spacing tokens show numeric values
5. Continue to import...

✅ **Expected**: All Tailwind categories generate correctly

---

### Test 4: Back Navigation

#### 4.1 From Radix Selector
1. Open Radix selector
2. Click **"← Back"** button (top left)
3. Should return to Library Selection screen

#### 4.2 From Tailwind Selector
1. Open Tailwind selector
2. Click **"← Back"** button
3. Should return to Library Selection screen

#### 4.3 From Collection Selector
1. Generate tokens from any library
2. At Collection Selector, click **"Cancel"**
3. Should return to Library Selection screen

✅ **Expected**: Back navigation works from all screens

---

### Test 5: JSON Import (Legacy Flow)

1. From Library Selection, click **"Import JSON"**
2. Should go to file upload screen
3. Import a JSON file (use existing sample-tokens.json)
4. Verify existing import flow still works

✅ **Expected**: Old JSON import flow intact

---

### Test 6: End-to-End Import

#### 6.1 Radix → Figma
1. Select **Radix Colors**
2. Choose: **Blue, Green, Red** (dark mode ON)
3. Generate: **72 tokens**
4. Collection: Create new "Radix Test"
5. Import all tokens
6. Verify in Figma Variables panel:
   - Collection "Radix Test" exists
   - Variables: `radix/blue/1` through `radix/red/dark/12`
   - Color values are correct
   - Dark mode colors are different from light

#### 6.2 Tailwind → Figma
1. Select **Tailwind CSS**
2. Choose: **Colors only** (242 tokens)
3. Generate preview
4. Collection: Create new "Tailwind Test"
5. Import all tokens
6. Verify in Figma Variables panel:
   - Collection "Tailwind Test" exists
   - Variables: `tw/slate/50`, `tw/blue/500`, etc.
   - All 22 color palettes present
   - Each has 11 shades (50, 100, 200...950)

✅ **Expected**: Variables created successfully in Figma

---

### Test 7: Token Counts

Verify token counts are accurate:

| Library | Selection | Expected Count |
|---------|-----------|----------------|
| Radix | 1 palette, light only | 12 tokens |
| Radix | 1 palette, light + dark | 24 tokens |
| Radix | 3 palettes, light + dark | 72 tokens |
| Radix | All 30 palettes, both modes | 720 tokens |
| Tailwind | Colors only | 242 tokens |
| Tailwind | Spacing only | 37 tokens |
| Tailwind | All categories | ~300 tokens |

✅ **Expected**: All counts match

---

## 🐛 Common Issues & Troubleshooting

### Issue: Plugin shows white screen
**Fix**: Rebuild and reload
```bash
pnpm figma:build
```
Then reload plugin in Figma

### Issue: Token count shows "NaN" or wrong number
**Check**: 
- Is dark mode checkbox state correct?
- Are palettes actually selected? (checkboxes checked)
- Console for any errors

### Issue: Tokens not importing
**Check**:
- Figma Variables panel - do they appear there?
- Console for errors during import
- Try with fewer tokens first (1-2 palettes)

### Issue: Colors look wrong
**Check**:
- Inspect variable value in Figma
- Compare with source (Radix Colors docs, Tailwind docs)
- Check if dark mode colors are swapped

### Issue: Back button doesn't work
**Check**:
- Console for errors
- Try clicking other navigation
- Rebuild if needed

---

## 📊 Success Criteria

Phase 1 is complete when:

- ✅ Library selection screen loads
- ✅ Radix selector works (select palettes, dark mode toggle)
- ✅ Tailwind selector works (select categories)
- ✅ Token generation produces correct count
- ✅ Token names follow conventions (`radix/*`, `tw/*`)
- ✅ Tokens import to Figma Variables successfully
- ✅ Back navigation works throughout
- ✅ Legacy JSON import still works
- ✅ No console errors
- ✅ Performance is smooth (no lag)

---

## 🎉 Next Steps After Testing

If all tests pass:

1. ✅ Mark Phase 1 as **Complete**
2. 📝 Document any bugs found
3. 🎨 Optional: Polish UI/UX based on feedback
4. 🚀 Move to **Phase 2: Custom Palette Generator**

---

## 📸 Screenshot Checklist

For documentation, capture:

- [ ] Library selection screen
- [ ] Radix selector (with palettes selected)
- [ ] Tailwind selector (with categories selected)
- [ ] Token preview table (with library tokens)
- [ ] Figma Variables panel (after import)

---

**Happy testing! 🎨**

Report issues to: [Your preferred channel]

