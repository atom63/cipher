# Token System Maturity Levels & Feature Planning

**Date:** October 18, 2025  
**Purpose:** Design a plugin that bridges code and design across all token system complexities  
**Goal:** Support users at every maturity level without forcing premature complexity

---

## 🎯 The Challenge

Design systems exist on a **maturity spectrum**:

```
Simple ←──────────────────────────────────→ Complex

Level 0    Level 1      Level 2      Level 3      Level 4
No tokens  Flat tokens  Organized    Three-tier   Multi-brand
           (Shadcn)     categories   (Scalable)   (Enterprise)

Student    Freelancer   Small Team   Product      Design Team
Learning   Quick site   Startup      Company      Enterprise
```

**Question:** How do we bridge code ↔ design for ALL levels?

---

## 📊 Token System Maturity Levels

### Level 0: No Design Tokens (Generate from Scratch)

**User Situation:**
- Starting a new project
- No existing design system
- Needs: Complete token system generated

**What We Generate:**

```typescript
// Generated token system (full package)
{
  colors: {
    primitives: ['zinc', 'blue'],        // 22 tokens
    abstractions: ['surface', 'primary'], // 22 tokens
    semantics: ['background', 'foreground', 'primary'] // 12 tokens
  },
  spacing: {
    values: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96] // 10 tokens
  },
  radius: {
    values: ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'full'] // 7 tokens
  },
  typography: {
    families: ['sans', 'serif', 'mono'],      // 3 tokens
    sizes: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'], // 8 tokens
    weights: [400, 500, 600, 700]             // 4 tokens
  },
  sizes: {
    values: ['xs', 'sm', 'md', 'lg', 'xl']    // 5 tokens
  }
}

Total: ~100 tokens generated
```

**Generation Methods:**

1. **Quick Start (AI-Assisted)**
   ```
   User provides:
   - Brand name: "Acme Corp"
   - Primary color: #3B82F6
   - Industry: "SaaS"
   
   AI generates:
   - Full color system (primitives + abstractions + semantics)
   - Spacing scale (Tailwind-based)
   - Typography scale (modern sans-serif)
   - Border radius (slightly rounded)
   - Complete design system in 30 seconds
   ```

2. **Template-Based**
   ```
   User chooses template:
   - SaaS App (modern, professional)
   - Marketing Site (bold, vibrant)
   - Dashboard (compact, neutral)
   - E-commerce (warm, trustworthy)
   
   Each template includes:
   - Pre-configured color palettes
   - Appropriate spacing
   - Typography choices
   - Component-ready tokens
   ```

3. **Library Preset**
   ```
   User selects:
   - Color library: Radix Colors
   - Spacing: Tailwind scale
   - Typography: Inter + system fonts
   - Radius: Moderate (8px)
   
   Plugin combines:
   - Professional presets
   - Proven combinations
   - Ready to use
   ```

4. **Guided Wizard**
   ```
   Step-by-step questions:
   1. What's your primary brand color?
   2. What style? (Modern/Classic/Minimal)
   3. What type of product? (App/Site/Dashboard)
   4. Compact or spacious?
   5. Sharp or rounded corners?
   
   Generates custom system based on answers
   ```

**Characteristics:**
- ✅ Zero existing tokens
- ✅ Complete system generated
- ✅ Production-ready
- ✅ Follows best practices (three-tier)
- ✅ Customizable after generation
- ✅ Educational (teaches structure)

**Users:** 
- Complete beginners
- New projects
- Startups finding their brand
- Designers exploring options

**Plugin Support:** ✅ **Generate from Scratch mode** (NEW)

**Time:** 30 seconds - 5 minutes (depending on method)

---

### Level 0→1: No Design Tokens (Raw Values in Code)

**Code Example:**
```css
/* No tokens - just hardcoded values */
.button {
  background: #3B82F6;
  padding: 16px;
  border-radius: 8px;
}
```

**Figma State:** No variables, just colors/styles

**Characteristics:**
- ❌ No token system
- ❌ No consistency
- ❌ Manual updates everywhere
- ❌ High maintenance cost

**Users:** Beginners, one-page sites

**Plugin Support:** Not applicable (no tokens to sync)

---

### Level 1: Flat Tokens (Shadcn Style)

**Code Example:**
```css
/* Flat semantic tokens - no references */
:root {
  --background: #ffffff;
  --foreground: #000000;
  --primary: #3B82F6;
  --secondary: #10B981;
  --muted: #F3F4F6;
  --border: #E5E7EB;
}
```

**Figma State:** Single collection, ~20-30 variables

**Characteristics:**
- ✅ Tokens exist
- ✅ Named semantically
- ❌ No structure/layers
- ❌ No references
- ❌ Hard to rebrand (update 20+ tokens)
- ❌ No color scales

**Users:** Solo designers, simple apps, Shadcn users

**Plugin Support:** ✅ **Quick Import mode**

---

### Level 2: Organized Tokens (Categorized)

**Code Example:**
```css
/* Organized by category */
:root {
  /* Colors */
  --color-primary: #3B82F6;
  --color-secondary: #10B981;
  --color-neutral-100: #F3F4F6;
  --color-neutral-900: #1F2937;
  
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-4: 16px;
  
  /* Typography */
  --font-size-sm: 14px;
  --font-size-base: 16px;
}
```

**Figma State:** 2-3 collections (colors, spacing, typography)

**Characteristics:**
- ✅ Organized structure
- ✅ Multiple collections
- ❌ Still mostly flat
- ❌ Limited references
- ❌ Manual rebrand (better, but still tedious)

**Users:** Small teams, startups, organized solo devs

**Plugin Support:** ✅ **Quick Import with category separation**

---

### Level 3: Three-Tier System (Scalable)

**Code Example:**
```css
/* Primitives - Foundation */
:root {
  --color-blue-50: #EFF6FF;
  --color-blue-500: #3B82F6;
  --color-blue-950: #172554;
  --color-zinc-50: #FAFAFA;
  --color-zinc-500: #71717A;
  --color-zinc-950: #09090B;
}

/* Abstractions - Meaning */
:root {
  --color-primary-50: var(--color-blue-50);
  --color-primary-500: var(--color-blue-500);
  --color-primary-950: var(--color-blue-950);
  --color-surface-50: var(--color-zinc-50);
  --color-surface-500: var(--color-zinc-500);
  --color-surface-950: var(--color-zinc-950);
}

/* Semantics - Components */
:root {
  --background: var(--color-surface-50);
  --foreground: var(--color-surface-950);
  --primary: var(--color-primary-500);
}

.dark {
  --background: var(--color-surface-950);
  --foreground: var(--color-surface-50);
}
```

**Figma State:** 3 collections with modes, ~150-200 variables

**Characteristics:**
- ✅ Three layers (primitives/abstractions/semantics)
- ✅ Full color scales (50-950)
- ✅ References/cascade
- ✅ Easy rebrand (change 1 abstraction)
- ✅ Mode support (light/dark)
- ✅ Maintainable at scale

**Users:** Product teams, design systems, agencies

**Plugin Support:** ✅ **Scalable System mode**

---

### Level 4: Multi-Brand System (Enterprise)

**Code Example:**
```css
/* Base primitives (shared) */
:root {
  --color-blue-500: #3B82F6;
  --color-emerald-500: #10B981;
  --color-violet-500: #8B5CF6;
  --color-zinc-500: #71717A;
}

/* Brand A - Tech Startup */
.brand-a {
  --color-primary-500: var(--color-blue-500);
  --color-surface-500: var(--color-zinc-500);
}

/* Brand B - Creative Agency */
.brand-b {
  --color-primary-500: var(--color-violet-500);
  --color-surface-500: var(--color-zinc-500);
}

/* Brand C - Health & Wellness */
.brand-c {
  --color-primary-500: var(--color-emerald-500);
  --color-surface-500: var(--color-zinc-500);
}

/* Semantics (same for all brands) */
.brand-a, .brand-b, .brand-c {
  --primary: var(--color-primary-500);
  --background: var(--color-surface-50);
}
```

**Figma State:** 1 primitive collection + multiple abstraction collections per brand + shared semantics

**Characteristics:**
- ✅ All Level 3 benefits
- ✅ Multiple brand variants
- ✅ Shared primitives
- ✅ Theme switching
- ✅ White-label ready
- ✅ Efficient multi-tenancy

**Users:** Agencies, white-label products, enterprise design teams

**Plugin Support:** ✅ **Multi-Brand Generator mode**

---

## 🏗️ Universal Data Model

### Token Structure That Works for All Levels

```typescript
interface UniversalToken {
  // Core properties (all levels)
  id: string;
  name: string;
  value: string | TokenReference;
  type: TokenType; // 'color', 'spacing', 'fontSize', etc.
  
  // Organization (Level 2+)
  category?: string; // 'colors', 'spacing', 'typography'
  collection?: string; // Figma collection name
  
  // Structure (Level 3+)
  layer?: 'primitive' | 'abstraction' | 'semantic';
  reference?: string; // "{primitives.blue.500}"
  
  // Modes (Level 3+)
  modes?: Record<string, string>; // { Light: "...", Dark: "..." }
  
  // Multi-brand (Level 4)
  brand?: string; // 'brand-a', 'brand-b', etc.
  
  // Metadata (all levels)
  description?: string;
  metadata?: {
    source?: 'code' | 'figma' | 'generated';
    lastModified?: string;
    author?: string;
    tags?: string[];
  };
}

// Reference type
interface TokenReference {
  ref: string; // "{primitives.blue.500}"
  resolved?: string; // Actual value after resolution
}

// Token type
type TokenType = 
  | 'color' 
  | 'spacing' 
  | 'sizing'
  | 'fontSize' 
  | 'fontFamily'
  | 'fontWeight'
  | 'lineHeight'
  | 'borderRadius'
  | 'borderWidth'
  | 'shadow'
  | 'opacity'
  | 'duration'
  | 'easing'
  | (string & {}); // Extensible
```

**Key Insight:** The same data model supports all levels by making advanced properties optional.

---

## 🔄 Import/Export Strategy for Each Level

### Level 1: Flat Tokens

**Import (Code → Figma):**
```json
Input (simple JSON):
{
  "primary": "#3B82F6",
  "secondary": "#10B981",
  "background": "#FFFFFF"
}

Plugin Processing:
- Detect: Flat structure (no nesting, no references)
- Create: Single collection "Imported Tokens"
- Map: Direct value assignment

Figma Output:
Collection: "Imported Tokens"
- primary = #3B82F6
- secondary = #10B981
- background = #FFFFFF
```

**Export (Figma → Code):**
```json
Figma Input:
Collection with 20 flat variables

Plugin Processing:
- Detect: Single collection, no references
- Export: Flat JSON or CSS

Code Output (CSS):
:root {
  --primary: #3B82F6;
  --secondary: #10B981;
  --background: #FFFFFF;
}
```

---

### Level 2: Organized Tokens

**Import (Code → Figma):**
```json
Input (categorized JSON):
{
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#10B981"
  },
  "spacing": {
    "sm": "8px",
    "md": "16px"
  }
}

Plugin Processing:
- Detect: Nested structure by category
- Create: Multiple collections OR organized within one
- Option: User chooses organization

Figma Output (Option A - Multiple Collections):
Collection: "Colors"
- primary = #3B82F6
- secondary = #10B981

Collection: "Spacing"
- sm = 8
- md = 16

Figma Output (Option B - Single Collection with Groups):
Collection: "Design Tokens"
- colors/primary = #3B82F6
- colors/secondary = #10B981
- spacing/sm = 8
- spacing/md = 16
```

**Export (Figma → Code):**
```json
Plugin gives user choice:
[ ] Flat export (all in :root)
[x] Categorized export (nested JSON)
[ ] Separate files per category

Output (nested JSON):
{
  "colors": {
    "primary": { "value": "#3B82F6", "type": "color" },
    "secondary": { "value": "#10B981", "type": "color" }
  },
  "spacing": {
    "sm": { "value": "8px", "type": "spacing" },
    "md": { "value": "16px", "type": "spacing" }
  }
}
```

---

### Level 3: Three-Tier System

**Import (Code → Figma):**
```json
Input (three-tier JSON):
{
  "primitives": {
    "blue": {
      "500": { "value": "#3B82F6", "type": "color" }
    }
  },
  "abstractions": {
    "primary": {
      "500": { "value": "{primitives.blue.500}", "type": "color" }
    }
  },
  "semantics": {
    "primary": {
      "value": "{abstractions.primary.500}",
      "type": "color",
      "modes": {
        "Light": "{abstractions.primary.500}",
        "Dark": "{abstractions.primary.400}"
      }
    }
  }
}

Plugin Processing:
- Detect: Three layers with references
- Create: 3 collections
- Resolve: References between layers
- Create: Modes in semantic layer

Figma Output:
Collection: "Primitives"
- blue/500 = #3B82F6

Collection: "Abstractions"
- primary/500 → references primitives/blue/500

Collection: "Semantics" (with modes: Light, Dark)
- primary → references abstractions/primary/500
  Light mode: → abstractions/primary/500
  Dark mode: → abstractions/primary/400
```

**Export (Figma → Code):**
```typescript
Plugin detects:
- 3 collections named Primitives/Abstractions/Semantics
- OR detects reference patterns
- Preserves layer structure

Output (structured JSON):
{
  "$schema": "three-tier-tokens",
  "primitives": { /* raw values */ },
  "abstractions": { /* references primitives */ },
  "semantics": { /* references abstractions */ }
}

OR output separate CSS files:
- primitives.css (raw values)
- abstractions.css (references primitives)
- semantics.css (references abstractions, has modes)
```

---

### Level 4: Multi-Brand System

**Import (Code → Figma):**
```json
Input (multi-brand JSON):
{
  "primitives": { /* shared */ },
  "brands": {
    "brand-a": {
      "primary": { "500": "{primitives.blue.500}" }
    },
    "brand-b": {
      "primary": { "500": "{primitives.violet.500}" }
    }
  },
  "semantics": { /* same for all brands */ }
}

Plugin Processing:
- Detect: Multiple brand definitions
- Create: 1 primitive + N abstraction collections + 1 semantic

Figma Output:
Collection: "Primitives"
- blue/500, violet/500, etc.

Collection: "Abstractions - Brand A"
- primary/500 → primitives/blue/500

Collection: "Abstractions - Brand B"
- primary/500 → primitives/violet/500

Collection: "Semantics"
- primary → abstractions/primary/500
  (Can reference either brand's abstractions)
```

---

## 🎨 Feature Matrix by Level

### Core Features (All Levels)

| Feature | Level 1 | Level 2 | Level 3 | Level 4 |
|---------|---------|---------|---------|---------|
| **Import JSON** | ✅ | ✅ | ✅ | ✅ |
| **Export JSON** | ✅ | ✅ | ✅ | ✅ |
| **Import CSS variables** | ✅ | ✅ | ✅ | ✅ |
| **Export CSS variables** | ✅ | ✅ | ✅ | ✅ |
| **Color tokens** | ✅ | ✅ | ✅ | ✅ |
| **Spacing tokens** | ✅ | ✅ | ✅ | ✅ |
| **Typography tokens** | ✅ | ✅ | ✅ | ✅ |

### Organization Features

| Feature | Level 1 | Level 2 | Level 3 | Level 4 |
|---------|---------|---------|---------|---------|
| **Single collection** | ✅ Default | ○ Option | ○ Not typical | ❌ No |
| **Multiple collections** | ○ Manual | ✅ By category | ✅ By layer | ✅ By brand |
| **Category grouping** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Nested structure** | ❌ No | ○ Basic | ✅ Advanced | ✅ Advanced |

### Reference Features

| Feature | Level 1 | Level 2 | Level 3 | Level 4 |
|---------|---------|---------|---------|---------|
| **Token references** | ❌ No | ○ Some | ✅ Structured | ✅ Structured |
| **Reference resolution** | N/A | ○ Basic | ✅ Advanced | ✅ Advanced |
| **Circular detection** | N/A | ○ Basic | ✅ Yes | ✅ Yes |
| **Reference visualization** | N/A | ❌ No | ✅ Diagram | ✅ Diagram |

### Mode/Theme Features

| Feature | Level 1 | Level 2 | Level 3 | Level 4 |
|---------|---------|---------|---------|---------|
| **Light/Dark modes** | ❌ Manual | ○ If imported | ✅ Auto-gen | ✅ Auto-gen |
| **Multiple modes** | ❌ No | ○ Basic | ✅ Yes | ✅ Yes |
| **Mode generation** | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Theme switching** | ❌ No | ❌ No | ○ Manual | ✅ Auto |

### Scaling Features

| Feature | Level 1 | Level 2 | Level 3 | Level 4 |
|---------|---------|---------|---------|---------|
| **Rebrand time** | ⏱️ 2-4 hrs | ⏱️ 1-2 hrs | ⏱️ 15 sec | ⏱️ 15 sec |
| **Color scales (50-950)** | ❌ No | ○ Manual | ✅ Auto | ✅ Auto |
| **Multi-brand** | ❌ Duplicate | ❌ Duplicate | ○ Manual | ✅ Auto |
| **Brand variants** | ❌ No | ❌ No | ○ 1-2 | ✅ Unlimited |

### Generation Features

| Feature | Level 1 | Level 2 | Level 3 | Level 4 |
|---------|---------|---------|---------|---------|
| **Library presets** | ✅ Flat | ✅ Organized | ✅ Three-tier | ✅ Three-tier |
| **Custom palette** | ✅ Basic | ✅ Organized | ✅ Scales | ✅ Scales |
| **Layer generation** | ❌ N/A | ❌ No | ✅ Yes | ✅ Yes |
| **Brand generation** | ❌ No | ❌ No | ❌ No | ✅ Yes |

### Upgrade Features

| Feature | Level 1 | Level 2 | Level 3 | Level 4 |
|---------|---------|---------|---------|---------|
| **Upgrade to next level** | ✅ → L2 | ✅ → L3 | ✅ → L4 | ✅ Complete |
| **Automatic detection** | ✅ Yes | ✅ Yes | ✅ Yes | N/A |
| **Guided migration** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Preserve existing** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 🎯 Plugin Mode Selection Logic

### Smart Detection Algorithm

```typescript
function detectTokenLevel(tokens: any): TokenLevel {
  // Check for multi-brand (Level 4)
  if (tokens.brands || hasBrandCollections(tokens)) {
    return 'level-4-multi-brand';
  }
  
  // Check for three-tier (Level 3)
  if (hasThreeLayers(tokens)) {
    return 'level-3-three-tier';
  }
  
  // Check for organized (Level 2)
  if (hasCategories(tokens) && getDepth(tokens) > 1) {
    return 'level-2-organized';
  }
  
  // Default to flat (Level 1)
  return 'level-1-flat';
}

function hasThreeLayers(tokens: any): boolean {
  const keys = Object.keys(tokens);
  const hasPrimitives = keys.includes('primitives');
  const hasAbstractions = keys.includes('abstractions');
  const hasSemantics = keys.includes('semantics') || keys.includes('semantic');
  
  // Or detect by reference patterns
  const hasReferences = hasTokenReferences(tokens);
  const referenceLayers = countReferenceLayers(tokens);
  
  return (hasPrimitives && hasAbstractions && hasSemantics) ||
         (hasReferences && referenceLayers >= 3);
}

function hasCategories(tokens: any): boolean {
  const keys = Object.keys(tokens);
  const commonCategories = [
    'colors', 'spacing', 'typography', 'sizing',
    'radius', 'shadows', 'effects'
  ];
  
  return keys.some(key => commonCategories.includes(key));
}
```

### Mode Recommendation UI

```
┌────────────────────────────────────┐
│ 🔍 Detected Token System           │
├────────────────────────────────────┤
│                                    │
│ Level: Flat Tokens (Level 1)      │
│ Tokens: 22 found                   │
│ Structure: Single layer            │
│ Collections: 1 (will create)       │
│                                    │
│ ────────────────────────────────   │
│                                    │
│ Import Options:                    │
│                                    │
│ ● Quick Import (Recommended)       │
│   Import as-is (flat structure)    │
│   Fast & simple                    │
│                                    │
│ ○ Upgrade to Three-Tier            │
│   Generate missing layers          │
│   Enable easy rebranding           │
│   Takes 2 more minutes             │
│   [Learn Why →]                    │
│                                    │
│ [Continue with Quick Import]       │
│                                    │
└────────────────────────────────────┘
```

---

## 🔄 Upgrade Paths Between Levels

### Level 1 → Level 2: Add Organization

**What it does:**
```
Before (Level 1 - Flat):
Collection: "Imported"
- primary = #3B82F6
- secondary = #10B981
- space-4 = 16
- text-base = 16

After (Level 2 - Organized):
Collection: "Colors"
- primary = #3B82F6
- secondary = #10B981

Collection: "Spacing"
- space-4 = 16

Collection: "Typography"
- text-base = 16
```

**Process:**
1. Analyze token names
2. Detect categories (color-, space-, text-, etc.)
3. Create collections per category
4. Move tokens to appropriate collections
5. Optional: Rename for consistency

**UI:**
```
┌────────────────────────────────────┐
│ 📦 Organize into Categories        │
├────────────────────────────────────┤
│                                    │
│ Detected categories:               │
│ ☑ Colors (12 tokens)              │
│ ☑ Spacing (8 tokens)              │
│ ☑ Typography (2 tokens)           │
│                                    │
│ Create:                            │
│ ● Separate collections             │
│ ○ Single collection with groups    │
│                                    │
│ [Preview] [Organize →]            │
└────────────────────────────────────┘
```

---

### Level 2 → Level 3: Generate Three-Tier

**What it does:**
```
Before (Level 2 - Organized):
Collection: "Colors"
- primary = #3B82F6
- secondary = #10B981
- neutral-100 = #F3F4F6

After (Level 3 - Three-Tier):
Collection: "Primitives"
- blue-50 to blue-950 (11 shades)
- emerald-50 to emerald-950
- zinc-50 to zinc-950

Collection: "Abstractions"
- primary-50 to primary-950 → blue
- secondary-50 to secondary-950 → emerald
- surface-50 to surface-950 → zinc

Collection: "Semantics" (Light/Dark modes)
- primary → primary-500
- background → surface-50 (Light) / surface-950 (Dark)
```

**Process:**
1. Analyze existing colors
2. Find closest Tailwind matches
3. Generate full primitive scales
4. Create abstraction mappings
5. Generate semantic tokens with modes
6. Create references/cascade

**UI:**
```
┌────────────────────────────────────┐
│ 🎓 Upgrade to Three-Tier           │
├────────────────────────────────────┤
│                                    │
│ Current: 12 color tokens (flat)    │
│ Result: 150+ tokens (3 layers)     │
│                                    │
│ Benefits:                          │
│ ✓ Full color scales (50-950)      │
│ ✓ Easy rebrand (15 seconds)       │
│ ✓ Light/Dark modes                │
│ ✓ Multi-brand ready                │
│                                    │
│ ─── Color Matching ───             │
│                                    │
│ primary (#3B82F6)                  │
│ → Match: Tailwind Blue             │
│ → Creates: 11 blue shades          │
│                                    │
│ [Customize Matching] [Generate →] │
│                                    │
└────────────────────────────────────┘
```

---

### Level 3 → Level 4: Add Multi-Brand

**What it does:**
```
Before (Level 3 - Single Brand):
Collection: "Abstractions"
- primary-500 → blue-500
- surface-500 → zinc-500

After (Level 4 - Multi-Brand):
Collection: "Primitives" (shared)
- blue-500, emerald-500, violet-500, zinc-500

Collection: "Abstractions - Brand A"
- primary-500 → blue-500
- surface-500 → zinc-500

Collection: "Abstractions - Brand B"
- primary-500 → emerald-500
- surface-500 → zinc-500

Collection: "Abstractions - Brand C"
- primary-500 → violet-500
- surface-500 → zinc-500

Collection: "Semantics" (shared)
- primary → primary-500
  (Can use any brand's abstractions)
```

**Process:**
1. Keep primitives (shared)
2. Duplicate abstractions per brand
3. Change color mappings
4. Keep semantics (shared)
5. Configure brand switching

**UI:**
```
┌────────────────────────────────────┐
│ 🎨 Create Brand Variants           │
├────────────────────────────────────┤
│                                    │
│ Base system: Blue + Zinc           │
│                                    │
│ Add brand variants:                │
│                                    │
│ ┌─ Brand A (Current) ──────────┐  │
│ │ Primary: Blue                 │  │
│ │ Surface: Zinc                 │  │
│ └───────────────────────────────┘  │
│                                    │
│ ┌─ Brand B (New) ──────────────┐  │
│ │ Primary: [Emerald ▼]         │  │
│ │ Surface: [Zinc ▼]            │  │
│ │ [Preview]                     │  │
│ └───────────────────────────────┘  │
│                                    │
│ [+ Add Brand]                      │
│                                    │
│ [Generate Variants →]              │
│                                    │
└────────────────────────────────────┘
```

---

## 🛠️ Technical Implementation

### Flexible Parser

```typescript
interface ParseOptions {
  // Detect or force level
  level?: 'auto' | 'level-1' | 'level-2' | 'level-3' | 'level-4';
  
  // Organization
  separateCollections?: boolean;
  collectionPrefix?: string;
  
  // References
  resolveReferences?: boolean;
  preserveReferences?: boolean;
  
  // Modes
  createModes?: boolean;
  modeNames?: string[]; // ['Light', 'Dark']
  
  // Brand
  brandName?: string;
  multiBrand?: boolean;
}

async function parseTokens(
  input: string | object,
  options: ParseOptions
): Promise<UniversalToken[]> {
  // 1. Detect format (JSON, CSS, etc.)
  const format = detectFormat(input);
  
  // 2. Parse to intermediate format
  const raw = await parse(input, format);
  
  // 3. Detect or use specified level
  const level = options.level === 'auto' 
    ? detectTokenLevel(raw)
    : options.level;
  
  // 4. Process based on level
  switch (level) {
    case 'level-1':
      return parseFlatTokens(raw, options);
    case 'level-2':
      return parseOrganizedTokens(raw, options);
    case 'level-3':
      return parseThreeTierTokens(raw, options);
    case 'level-4':
      return parseMultiBrandTokens(raw, options);
  }
}
```

### Flexible Exporter

```typescript
interface ExportOptions {
  // Target level
  level?: 'level-1' | 'level-2' | 'level-3' | 'level-4';
  
  // Format
  format: 'json' | 'css' | 'scss' | 'js' | 'ts';
  
  // Structure
  flat?: boolean; // Flatten nested structure
  separate?: boolean; // Separate files per collection/layer
  
  // References
  resolveReferences?: boolean; // Convert refs to values
  
  // Modes
  separateModes?: boolean; // Separate :root and .dark
  
  // Brand
  brandFilter?: string; // Export specific brand only
}

async function exportTokens(
  tokens: UniversalToken[],
  options: ExportOptions
): Promise<string | Record<string, string>> {
  // 1. Group by collection/layer
  const grouped = groupTokens(tokens, options.level);
  
  // 2. Resolve references if needed
  if (options.resolveReferences) {
    tokens = resolveAllReferences(tokens);
  }
  
  // 3. Format based on level and format
  switch (options.format) {
    case 'css':
      return exportToCSS(grouped, options);
    case 'json':
      return exportToJSON(grouped, options);
    // etc.
  }
}
```

---

## 📋 Feature Checklist by Level

### Must-Have Features (All Levels)

- [ ] **Import JSON** - Parse flat/nested/referenced tokens
- [ ] **Export JSON** - Output in various formats
- [ ] **Import CSS variables** - Parse `:root` declarations
- [ ] **Export CSS variables** - Generate CSS files
- [ ] **Color tokens** - Support hex/rgb/oklch
- [ ] **Spacing tokens** - Support px/rem/em
- [ ] **Typography tokens** - Support font families/sizes/weights
- [ ] **Preview** - Show tokens before import
- [ ] **Validation** - Check for errors
- [ ] **Conflict detection** - Handle existing variables

### Level 1 Specific (Flat)

- [ ] **Quick import** - 2-minute flow
- [ ] **Single collection** - Simple organization
- [ ] **Upgrade prompt** - Suggest Level 2/3
- [ ] **Shadcn detection** - Auto-detect Shadcn tokens
- [ ] **Flat export** - Simple CSS output

### Level 2 Specific (Organized)

- [ ] **Category detection** - Auto-detect token categories
- [ ] **Multiple collections** - Create per category
- [ ] **Collection options** - User chooses organization
- [ ] **Grouped export** - Export by category
- [ ] **Upgrade to Level 3** - Three-tier migration

### Level 3 Specific (Three-Tier)

- [ ] **Layer detection** - Identify primitives/abstractions/semantics
- [ ] **Reference creation** - Generate cascade
- [ ] **Reference visualization** - Show token flow
- [ ] **Mode generation** - Auto-create Light/Dark
- [ ] **Primitive library** - Tailwind/Radix presets
- [ ] **Color scale generation** - Generate 50-950
- [ ] **Abstraction mapper** - UI to map primitives
- [ ] **Semantic generator** - Auto-generate component tokens
- [ ] **Structured export** - Layer-aware output
- [ ] **Upgrade to Level 4** - Multi-brand setup

### Level 4 Specific (Multi-Brand)

- [ ] **Brand detection** - Identify brand variants
- [ ] **Brand generator** - Create N variants
- [ ] **Brand switcher** - UI to manage brands
- [ ] **Shared primitives** - Single source across brands
- [ ] **Brand-specific abstractions** - Per-brand mappings
- [ ] **Theme comparison** - Side-by-side preview
- [ ] **Bulk brand creation** - Generate 5+ at once
- [ ] **Brand export** - Export specific brands

---

## 🎯 Recommended Implementation Order

### Phase 1: Foundation (Weeks 1-2)
✅ Support Level 1 (Flat) - Already mostly done
- [x] Import flat JSON
- [x] Export flat JSON
- [x] Single collection
- [ ] Upgrade prompts

### Phase 2: Organization (Weeks 3-4)
✅ Support Level 2 (Organized)
- [ ] Category detection
- [ ] Multiple collection creation
- [ ] Organized export
- [ ] Level 1 → Level 2 upgrade

### Phase 3: Three-Tier (Weeks 5-8)
✅ Support Level 3 (Three-Tier)
- [ ] Layer detection
- [ ] Reference system
- [ ] Mode generation
- [ ] Visualization
- [ ] Level 2 → Level 3 upgrade

### Phase 4: Multi-Brand (Weeks 9-12)
✅ Support Level 4 (Multi-Brand)
- [ ] Brand system
- [ ] Variant generator
- [ ] Brand switcher
- [ ] Level 3 → Level 4 upgrade

---

## ✅ Success Criteria

### Plugin Should:

1. **Detect any level** - Auto-identify token system maturity
2. **Import any level** - Parse flat to multi-brand
3. **Export any level** - Output in any format
4. **Upgrade any level** - Guided migration paths
5. **Preserve intent** - Maintain structure on roundtrip
6. **Support growth** - Easy to start, easy to scale

### Users Should:

1. **Start at their level** - No forced complexity
2. **Understand their level** - Clear explanation
3. **Upgrade when ready** - Natural progression
4. **Keep using plugin** - Works at every stage
5. **Bridge code ↔ design** - Seamless sync

---

**Built to bridge design and code at every stage of design system maturity** 🌉


