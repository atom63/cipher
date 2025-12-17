# Quick Start Guide - MVP Testing

## 🎉 Congratulations!

Your Design System Sync plugin MVP is ready! Here's how to test it:

## 🚀 Setup

1. **Open Figma Desktop App**
2. Go to **Plugins** → **Development** → **Import plugin from manifest...**
3. Select `figma/plugins/design-system/manifest.json`
4. Plugin is now installed!

## 🧪 Test the MVP

### Step 1: Run the Plugin
1. In Figma, go to **Plugins** → **Development** → **Atom63 Design System Sync**
2. The plugin should open with a file import screen

### Step 2: Test with Sample Tokens
You have three options:

#### Option A: Use the Sample File
1. Click "Drop a file here or click to browse"
2. Select `figma/plugins/design-system/sample-tokens.json`
3. Watch it parse!

#### Option B: Paste JSON
1. Scroll down to "Paste JSON/CSS"
2. Paste this:
```json
{
  "colors": {
    "brand-primary": "#3B82F6",
    "brand-secondary": "#10B981",
    "neutral-gray": "#6B7280"
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16
  }
}
```
3. Click "Parse Tokens"

#### Option C: Drag & Drop
1. Drag `sample-tokens.json` onto the drop zone
2. It will automatically parse

### Step 3: Review Tokens
After parsing, you'll see:
- **Token count** (colors, spacing)
- **Mapping table** showing:
  - Original name → Figma name transformation
  - Color previews
  - Values
- **Filters** to view by category
- **Select/deselect** checkboxes

### Step 4: Import to Figma
1. Review the tokens
2. Uncheck any you don't want to import
3. Click **"Import X Tokens"** button
4. Watch the progress bar
5. See success message!

### Step 5: Verify in Figma
1. Open Figma's **Variables** panel (right sidebar)
2. Look for **"Imported Tokens"** collection
3. You should see:
   - `color/primary`, `color/secondary`, etc.
   - `spacing/xs`, `spacing/sm`, etc.
4. Try using them on shapes!

## 🎨 What Works (MVP)

✅ JSON file upload
✅ Paste JSON directly
✅ Parse color tokens (hex format)
✅ Parse spacing tokens (numeric)
✅ Token name transformation
✅ Review table with previews
✅ Select/deselect tokens
✅ Batch import to Figma Variables
✅ Progress tracking
✅ Success/error reporting

## 🚧 Coming Soon

- CSS variable parsing
- Typography tokens
- Effects/shadows tokens
- Conflict detection
- Name transformation options
- Export from Figma

## 🐛 Troubleshooting

**Plugin shows white screen:**
- Rebuild: `pnpm figma:build`
- Reload plugin in Figma

**Parsing fails:**
- Check JSON format (use example above)
- Colors must be hex format: `#3B82F6`
- Spacing must be numbers: `16` or `"16"`

**Variables not created:**
- Check Figma console for errors
- Ensure you have edit access to the file
- Try with fewer tokens first

**Import successful but variables not visible:**
- Check **Variables** panel in right sidebar
- Look for "Imported Tokens" collection
- Refresh Figma if needed

## 📊 Example Token File

Create a file called `my-tokens.json`:

```json
{
  "colors": {
    "brand": {
      "primary": "#3B82F6",
      "secondary": "#10B981"
    },
    "text": {
      "primary": "#111827",
      "secondary": "#6B7280",
      "muted": "#9CA3AF"
    },
    "bg": {
      "primary": "#FFFFFF",
      "secondary": "#F9FAFB",
      "tertiary": "#F3F4F6"
    },
    "border": {
      "light": "#E5E7EB",
      "dark": "#D1D5DB"
    }
  },
  "spacing": {
    "spacing-xs": 4,
    "spacing-sm": 8,
    "spacing-md": 16,
    "spacing-lg": 24,
    "spacing-xl": 32,
    "spacing-2xl": 48,
    "spacing-3xl": 64,
    "spacing-4xl": 96
  }
}
```

Note: Nested objects work too! `brand.primary` becomes `color/brand/primary`

## 🎯 Next Steps

1. Test with your real design tokens
2. Try different token structures
3. Report any bugs or issues
4. Request features!

## 🔧 Development

**Rebuild after changes:**
```bash
pnpm figma:build
```

**Watch mode (auto-rebuild):**
```bash
pnpm figma:dev
```

**Clean start:**
1. Close plugin in Figma
2. Rebuild: `pnpm figma:build`
3. Reopen plugin

---

## 💡 Tips

- **Use descriptive names**: `brand-primary` → `color/brand/primary`
- **Group related tokens**: Nested objects become paths
- **Test incrementally**: Start with a few tokens
- **Check console**: Right-click plugin → Inspect for errors
- **Backup first**: Test in a copy of your Figma file

**Happy designing! 🎨**

