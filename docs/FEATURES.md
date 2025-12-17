# Design System Sync Plugin - Feature Plan

## 🎯 Goal
Create a bidirectional design system plugin that syncs variables, styles, and tokens between code (CSS/JSON) and Figma.

## 📋 Phase 1: Import Flow (Priority)

### 1.1 File Import
- **Support formats:**
  - CSS Variables (`:root { --color-primary: #000; }`)
  - CSS Custom Properties
  - Design Tokens (JSON) - Style Dictionary format
  - Tailwind Config (tailwind.config.js/ts)
  - JSON tokens (custom format)

- **Import methods:**
  - File upload via plugin UI
  - Paste raw CSS/JSON
  - Fetch from URL (optional)

### 1.2 Token Parsing & Mapping
**Parse the following token types:**

#### Colors
```json
{
  "color": {
    "brand": {
      "primary": { "value": "#3B82F6" },
      "secondary": { "value": "#10B981" }
    }
  }
}
```

#### Typography
```json
{
  "font": {
    "family": {
      "sans": { "value": "Inter, system-ui, sans-serif" }
    },
    "size": {
      "sm": { "value": "14px" },
      "base": { "value": "16px" }
    },
    "weight": {
      "normal": { "value": 400 },
      "bold": { "value": 700 }
    }
  }
}
```

#### Spacing
```json
{
  "spacing": {
    "xs": { "value": "4px" },
    "sm": { "value": "8px" },
    "md": { "value": "16px" },
    "lg": { "value": "24px" }
  }
}
```

#### Effects (shadows, blur, etc.)
```json
{
  "shadow": {
    "sm": { 
      "value": {
        "x": 0,
        "y": 1,
        "blur": 2,
        "spread": 0,
        "color": "rgba(0,0,0,0.05)"
      }
    }
  }
}
```

### 1.3 Confirmation UI (Middle Stage)

**UI Components needed:**
1. **File Preview Panel**
   - Show parsed tokens count
   - Show token categories (colors, typography, spacing, etc.)
   - Validation errors/warnings

2. **Mapping Table**
   ```
   Token Name          → Figma Variable Name    Value         Action
   --color-primary     → color/brand/primary    #3B82F6       ✓ Import
   --color-secondary   → color/brand/secondary  #10B981       ✓ Import
   --spacing-md        → spacing/md             16px          ✓ Import
   ```

3. **Name Transformation Options**
   - Keep original names
   - Auto-transform (kebab-case → path/based)
   - Custom prefix/suffix
   - Namespace/grouping

4. **Conflict Resolution**
   - Detect existing Figma variables
   - Options: Skip, Overwrite, Create New, Rename

5. **Batch Actions**
   - Select/Deselect all
   - Filter by category
   - Bulk rename
   - Preview changes

### 1.4 Batch Generation
- Create Figma Variables from confirmed tokens
- Create Color Styles
- Create Text Styles
- Create Effect Styles
- Progress indicator
- Success/error reporting

---

## 📋 Phase 2: Export Flow (Later Priority)

### 2.1 Figma Variable Export
- Select variables to export
- Choose export format (CSS/JSON/Style Dictionary)
- Generate formatted output
- Download or copy to clipboard

### 2.2 Style Export
- Export Color Styles
- Export Text Styles
- Export Effect Styles
- Map to token format

---

## 🏗️ Technical Architecture

### Data Flow
```
┌─────────────┐
│ Import File │
│ (CSS/JSON)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Parser    │  Parse CSS vars / JSON tokens
│   Engine    │  Validate & categorize
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Token Map  │  In-memory representation
│  (State)    │  { name, value, type, category }
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Confirmation│  User reviews & confirms
│     UI      │  Mapping, naming, conflicts
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Figma     │  Batch create variables/styles
│   API       │  figma.variables.create()
└─────────────┘
```

### File Structure
```
figma/plugins/design-system/
├── code.ts              # Plugin backend (Figma API)
├── ui.tsx               # Main UI entry
├── components/
│   ├── FileImport.tsx      # File upload/paste UI
│   ├── TokenTable.tsx      # Mapping table
│   ├── ConfirmDialog.tsx   # Confirmation UI
│   └── ProgressBar.tsx     # Batch operation progress
├── parsers/
│   ├── css-parser.ts       # Parse CSS variables
│   ├── json-parser.ts      # Parse JSON tokens
│   └── tailwind-parser.ts  # Parse Tailwind config
├── transformers/
│   ├── name-transformer.ts # Transform token names
│   └── value-converter.ts  # Convert values (px → number)
├── generators/
│   ├── variable-generator.ts  # Create Figma variables
│   ├── color-style-generator.ts
│   └── text-style-generator.ts
└── types/
    └── tokens.ts           # Token type definitions
```

### Token Data Model
```typescript
interface DesignToken {
  id: string;
  name: string;              // Original name from source
  figmaName: string;         // Transformed name for Figma
  value: TokenValue;
  type: TokenType;
  category: TokenCategory;
  description?: string;
  metadata?: Record<string, any>;
  action: 'import' | 'skip' | 'overwrite';
  conflict?: ConflictInfo;
}

type TokenType = 
  | 'color' 
  | 'spacing' 
  | 'fontSize' 
  | 'fontFamily' 
  | 'fontWeight'
  | 'lineHeight'
  | 'borderRadius'
  | 'shadow'
  | 'opacity'
  | 'dimension';

type TokenCategory = 
  | 'colors'
  | 'typography'
  | 'spacing'
  | 'effects'
  | 'borders'
  | 'other';

type TokenValue = 
  | string 
  | number 
  | ColorValue
  | ShadowValue
  | TypographyValue;

interface ConflictInfo {
  existingId: string;
  existingValue: any;
  resolution: 'skip' | 'overwrite' | 'rename';
}
```

---

## 🎨 UI/UX Flow (Phase 1)

### Step 1: Welcome Screen
```
┌────────────────────────────────────┐
│   Atom63 Design System Sync        │
├────────────────────────────────────┤
│                                    │
│   Import design tokens from code   │
│                                    │
│   [📁 Choose File]                 │
│   [📋 Paste CSS/JSON]              │
│                                    │
│   Supported formats:               │
│   • CSS Variables                  │
│   • Style Dictionary (JSON)        │
│   • Tailwind Config                │
│                                    │
└────────────────────────────────────┘
```

### Step 2: Parsing & Preview
```
┌────────────────────────────────────┐
│   ← Back     Parsing tokens...     │
├────────────────────────────────────┤
│                                    │
│   ✓ Found 45 tokens                │
│   • 12 Colors                      │
│   • 8 Spacing values               │
│   • 15 Typography tokens           │
│   • 10 Effects                     │
│                                    │
│   ⚠ 3 conflicts detected           │
│                                    │
│   [Continue to Review]             │
│                                    │
└────────────────────────────────────┘
```

### Step 3: Token Mapping & Confirmation
```
┌────────────────────────────────────────────────────────┐
│ ← Back    Token Mapping    [Import All] [Cancel]       │
├────────────────────────────────────────────────────────┤
│ Filters: [All] [Colors] [Typography] [Spacing] [⚠ Conflicts] │
│                                                        │
│ ☑ Select All    Transform: [Auto ▾] [+ Options]      │
├────────────────────────────────────────────────────────┤
│                                                        │
│ ☑ --color-primary                                     │
│   → color/brand/primary   #3B82F6   [✓ Import]       │
│                                                        │
│ ☑ --color-secondary                                   │
│   → color/brand/secondary #10B981   [✓ Import]       │
│                                                        │
│ ☐ --spacing-md        ⚠ Exists                       │
│   → spacing/md        16px          [Skip ▾]          │
│     Options: [Skip] [Overwrite] [Rename]              │
│                                                        │
│ ☑ --font-size-base                                    │
│   → typography/size/base  16px      [✓ Import]       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Step 4: Batch Import Progress
```
┌────────────────────────────────────┐
│   Importing tokens...              │
├────────────────────────────────────┤
│                                    │
│   ████████████░░░░░░░░  65%        │
│                                    │
│   Creating variables... 26/40      │
│                                    │
│   • color/brand/primary ✓          │
│   • color/brand/secondary ✓        │
│   • spacing/md ✓                   │
│   • typography/size/base...        │
│                                    │
└────────────────────────────────────┘
```

### Step 5: Success Summary
```
┌────────────────────────────────────┐
│   ✓ Import Complete                │
├────────────────────────────────────┤
│                                    │
│   Successfully imported:           │
│   • 12 Color variables             │
│   • 8 Spacing variables            │
│   • 15 Typography variables        │
│   • 10 Effect styles               │
│                                    │
│   Skipped: 3 (conflicts)           │
│                                    │
│   [View Variables] [Import More]   │
│                                    │
└────────────────────────────────────┘
```

---

## 🔧 Figma API Methods Needed

### Variables API
```typescript
// Create variable collection
figma.variables.createVariableCollection(name: string)

// Create variables
figma.variables.createVariable(
  name: string,
  collection: VariableCollection,
  type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'
)

// Set variable value
variable.setValueForMode(modeId: string, value: any)

// Get existing variables
figma.variables.getLocalVariables()
figma.variables.getLocalVariableCollections()
```

### Styles API
```typescript
// Create color style
figma.createPaintStyle()
style.paints = [{ type: 'SOLID', color: { r, g, b } }]

// Create text style
figma.createTextStyle()
style.fontSize = 16
style.fontName = { family: 'Inter', style: 'Regular' }

// Create effect style
figma.createEffectStyle()
style.effects = [{ type: 'DROP_SHADOW', ... }]
```

---

## 📦 Dependencies to Add

```json
{
  "dependencies": {
    "postcss": "^8.4.x",           // CSS parsing
    "postcss-value-parser": "^4.2.x", // Parse CSS values
    "color": "^4.2.x",              // Color manipulation/conversion
    "style-dictionary": "^4.0.x"    // Token format support (optional)
  }
}
```

---

## 🎯 MVP (Minimum Viable Product) - Phase 1.0

**Focus on the core flow:**
1. ✅ File upload (JSON only to start)
2. ✅ Parse simple color tokens
3. ✅ Show confirmation table
4. ✅ Create Figma color variables
5. ✅ Success message

**Simple JSON format to start:**
```json
{
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#10B981",
    "gray-100": "#F3F4F6"
  }
}
```

**Then expand:**
- Add CSS variable parsing
- Add spacing tokens
- Add typography tokens
- Add conflict detection
- Add name transformation options
- Add bulk actions

---

## 📝 Next Steps

1. **Update token types** - Create TypeScript interfaces
2. **Build file upload component** - FileImport.tsx
3. **Create JSON parser** - Start with simple color tokens
4. **Build token table UI** - Show parsed tokens
5. **Implement Figma variable creation** - Backend code.ts
6. **Test with real design tokens**

Would you like me to start implementing the MVP?

---

## ⚠️ Current Limitations

### Variables Only (Styles Not Supported)

**The plugin currently works with Figma Variables ONLY:**

✅ **Supported:**
- Figma Variables (Color, Number, String)
- Variable Collections & Modes
- Variable References/Aliases
- Import from JSON tokens
- Export to JSON tokens

❌ **NOT Supported:**
- Figma Color Styles
- Figma Text Styles
- Figma Effect Styles (shadows)
- Figma Grid Styles

### Why Variables Only?

1. **Modern System**: Variables are Figma's design token system
2. **Better Features**: Support modes, references, semantic naming
3. **Industry Standard**: Design token tools use Variables format

### Migration from Styles

If you have existing Styles:
- Use Figma's built-in "Create variable from style"
- Search Figma Community for migration plugins
- Use Variables for new design systems

### Other Limitations

- Cannot import images/assets
- Cannot create components
- No gradient or boolean variables (Figma limitation)
- No direct CSS Variable parsing (use JSON)

For full details, see [PRD.md - Current Implementation Status](./PRD.md#-current-implementation-status)

