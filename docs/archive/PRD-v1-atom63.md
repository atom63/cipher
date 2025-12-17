# Product Requirements Document (PRD)
## Atom63 Design System Sync Plugin

**Version:** 1.0  
**Last Updated:** October 13, 2025  
**Status:** In Development  
**Owner:** Atom63

---

## 📋 Document Control

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Oct 13, 2025 | Initial PRD - Product vision & MVP scope | Atom63 |

---

## 🎯 Executive Summary

A Figma plugin that enables designers to **generate professional design systems in minutes** by providing intelligent token generation, popular library presets (Radix, Tailwind), and custom palette generation with accessibility built-in.

**The Problem:** Designers spend 2-4 hours manually creating design system variables in Figma, or struggle to import tokens from existing libraries.

**The Solution:** One-click generation of production-ready design tokens with smart defaults, accessibility checking, and bidirectional sync between code and Figma.

**Unique Value Proposition:** First Figma plugin to combine library presets + intelligent color generation + accessibility validation in a single workflow.

---

## 🎪 Product Vision

### Vision Statement
*"Every designer should be able to bootstrap a professional, accessible design system in under 5 minutes."*

### Mission
Eliminate the tedious manual work of creating design tokens, democratize access to professional design systems, and bridge the gap between design tools and code.

### Product Goals (6 months)
1. **Time Savings:** Reduce design system setup from 2-4 hours → 5 minutes
2. **Adoption:** 1,000+ active users in first 3 months
3. **Quality:** 100% WCAG AAA compliant color generation
4. **Revenue:** Launch paid tier by Month 4 with 10% conversion

---

## 🔍 Problem Statement

### Current State

**Designers face three painful scenarios:**

1. **Starting from Scratch**
   - Manual creation of 100+ variables
   - Guessing at accessible color contrasts
   - Inconsistent spacing/typography scales
   - 2-4 hours of repetitive work

2. **Using Existing Design Libraries**
   - Tailwind/Radix are popular in code
   - No easy way to import them to Figma
   - Manual copying = errors + outdated tokens

3. **Syncing Between Code & Design**
   - Developers use JSON/CSS tokens
   - Designers use Figma variables
   - Manual sync = drift + inconsistencies

### Impact
- **Time waste:** 2-4 hours per project × 1,000s of designers
- **Quality issues:** Poor accessibility, inconsistent systems
- **Frustration:** Designers want to design, not copy values

### Opportunity
- **Market size:** 10M+ Figma users, ~500k active designers
- **Willingness to pay:** Design tools market = $2B+ annually
- **Competition gap:** No plugin solves token generation well

---

## 👥 Target Users & Personas

### Primary Persona: **"Sarah - Solo Product Designer"**

**Demographics:**
- Product designer at startup (team of 5-20)
- 2-4 years experience
- Uses Figma + React/Tailwind

**Pain Points:**
- Building design systems from scratch
- No design system resources/team
- Needs professional results fast
- Limited time for setup

**Goals:**
- Ship designs quickly
- Maintain consistency
- Use modern, accessible patterns
- Easy handoff to developers

**How our product helps:**
- Generates professional tokens in 5 minutes
- Radix/Tailwind presets match dev tools
- Accessibility built-in
- Export matches code format

**Quote:** *"I don't have time to manually create 200 color variables. I just want Tailwind colors in Figma."*

---

### Secondary Persona: **"Alex - Design System Lead"**

**Demographics:**
- Senior designer at mid-size company (50-200)
- 5+ years experience
- Maintains design system for team

**Pain Points:**
- Keeping Figma variables in sync with code
- Batch updating 100s of tokens
- Team using outdated values

**Goals:**
- Single source of truth
- Efficient bulk operations
- Version control for tokens
- Developer-friendly exports

**How our product helps:**
- Bidirectional sync (import/export)
- Batch rename/update operations
- JSON export matches code format
- Multiple collection management

**Quote:** *"Our Figma variables are out of sync with our CSS tokens. Manual updates take hours and cause errors."*

---

### Tertiary Persona: **"Jordan - Frontend Developer"**

**Demographics:**
- Frontend dev who does some design work
- Uses Figma occasionally
- Comfortable with code, not design tools

**Pain Points:**
- Creating design tokens in unfamiliar tool (Figma)
- Wants to use familiar libraries (Tailwind)
- Needs exact color values from code

**Goals:**
- Quick Figma setup
- Match dev environment tokens
- Export back to code format

**How our product helps:**
- One-click Tailwind import
- No design knowledge needed
- Export to JSON/CSS variables

**Quote:** *"I just need Tailwind colors in Figma so my designs match the code."*

---

## 🏆 Competitive Analysis

### Direct Competitors

#### **1. Tokens Studio (formerly Figma Tokens)**
**Strengths:**
- Mature product (2+ years)
- Comprehensive token management
- GitHub sync
- Large user base

**Weaknesses:**
- Complex learning curve
- Requires existing token JSON
- No token generation features
- Subscription required for sync

**Our Advantage:**
- Generate tokens without existing JSON
- Simpler UX for common workflows
- One-click library presets

---

#### **2. Variables Import Export**
**Strengths:**
- Simple import/export
- Free

**Weaknesses:**
- Basic functionality only
- No generation features
- No preview/editing
- Poor UX

**Our Advantage:**
- Intelligent generation
- Professional UI
- Batch editing
- Library presets

---

#### **3. Style Dictionary + Manual**
**Strengths:**
- Industry standard
- Flexible

**Weaknesses:**
- Requires coding knowledge
- Manual Figma setup
- Complex configuration
- Time-consuming

**Our Advantage:**
- No code required
- Instant Figma setup
- Visual interface
- 5 minutes vs 2 hours

---

### Indirect Competitors

#### **Building Manually**
- Time: 2-4 hours
- Quality: Inconsistent
- Accessibility: Not validated
- Maintenance: Manual

**Our Advantage:**
- Time: 5 minutes
- Quality: Professional presets
- Accessibility: Built-in validation
- Maintenance: One-click updates

---

### Competitive Matrix

| Feature | Us | Tokens Studio | Var Import | Manual |
|---------|-----|---------------|------------|--------|
| Import JSON | ✅ | ✅ | ✅ | ❌ |
| Export JSON | ✅ (v1.0) | ✅ | ✅ | ❌ |
| Generate from libraries | ✅ **Unique** | ❌ | ❌ | ❌ |
| Custom palette generator | ✅ **Unique** | ❌ | ❌ | ❌ |
| Accessibility checking | ✅ **Unique** | ❌ | ❌ | ❌ |
| Batch operations | ✅ | ✅ | ❌ | ❌ |
| Learning curve | Low | High | Low | N/A |
| Price | Free + Pro | $9+/mo | Free | Free |

**Key Differentiators:**
1. ⭐ **Token generation** (no existing config needed)
2. ⭐ **Library presets** (Radix, Tailwind, etc.)
3. ⭐ **Accessibility validation** (WCAG built-in)
4. ⭐ **Simple UX** (5-minute setup)

---

## 🎨 Product Features

### Phase 0: Foundation (✅ Completed)
**Status:** Shipped

- ✅ JSON token import
- ✅ Color & spacing tokens
- ✅ Token preview & review
- ✅ Multiple collection support
- ✅ Mode/theme support
- ✅ Inline editing
- ✅ Batch rename
- ✅ Create Figma variables
- ✅ Progress tracking

---

### Phase 1: Library Presets (🎯 MVP - Next)
**Goal:** Enable one-click import of popular design libraries  
**Timeline:** 2-3 weeks  
**Status:** In Development

#### Feature 1.1: Radix Colors Integration
**Priority:** P0 (Must-have)

**User Story:**
> "As a designer, I want to import Radix color palettes into Figma so I can use professional, accessible colors without manual setup."

**Acceptance Criteria:**
- [ ] User can select from all Radix color palettes (25+ colors)
- [ ] User can select multiple palettes (e.g., Slate + Blue + Green)
- [ ] Preview shows all shades (1-12) before import
- [ ] Import creates Figma color variables
- [ ] Light + dark mode scales imported correctly
- [ ] Variables named: `radix/[color]/[shade]` (e.g., `radix/blue/9`)

**Design:**
```
┌────────────────────────────────────┐
│ 🎨 Radix Colors                    │
├────────────────────────────────────┤
│ Select palettes:                   │
│                                    │
│ Gray Scales:                       │
│ ☑ Gray    ☑ Mauve   ☑ Slate       │
│ ☐ Sage    ☐ Olive   ☐ Sand        │
│                                    │
│ Colors:                            │
│ ☑ Blue    ☐ Green   ☐ Red         │
│ ☐ Orange  ☐ Purple  ☐ Pink        │
│ ... (all 25 colors)                │
│                                    │
│ 📊 Preview: 36 tokens (3 colors)  │
│ [Preview] [Generate]               │
└────────────────────────────────────┘
```

**Data Structure:**
```typescript
interface RadixPalette {
  name: string;           // "blue"
  displayName: string;    // "Blue"
  category: 'gray' | 'color';
  shades: {
    light: Record<1..12, string>;  // { 1: "#fbfdff", ... }
    dark: Record<1..12, string>;
  };
}
```

**Technical Notes:**
- Use official Radix Colors npm package
- Bundle color data (no API calls)
- Support alpha variants (_a colors)

---

#### Feature 1.2: Tailwind CSS Integration
**Priority:** P0 (Must-have)

**User Story:**
> "As a developer using Figma, I want to import Tailwind's default theme so my designs match our codebase exactly."

**Acceptance Criteria:**
- [ ] User can import Tailwind color palette
- [ ] User can import Tailwind spacing scale
- [ ] User can import Tailwind typography scale
- [ ] User can import Tailwind border radius values
- [ ] Preview shows token count before import
- [ ] Variables named with Tailwind convention: `tw/[category]/[name]`

**Design:**
```
┌────────────────────────────────────┐
│ 🎨 Tailwind CSS                    │
├────────────────────────────────────┤
│ Select categories:                 │
│                                    │
│ ☑ Colors (all Tailwind palettes)  │
│   → 220 color tokens               │
│                                    │
│ ☑ Spacing (0, 0.5, 1...96)        │
│   → 96 spacing tokens              │
│                                    │
│ ☑ Typography (text sizes)          │
│   → 10 font size tokens            │
│                                    │
│ ☑ Border Radius                    │
│   → 9 radius tokens                │
│                                    │
│ Total: 335 tokens                  │
│ [Preview] [Generate]               │
└────────────────────────────────────┘
```

**Token Examples:**
```
Colors:
- tw/slate/50 → #f8fafc
- tw/blue/500 → #3b82f6

Spacing:
- tw/spacing/4 → 16px (1rem)
- tw/spacing/8 → 32px (2rem)

Typography:
- tw/text/sm → 14px
- tw/text/base → 16px

Radius:
- tw/rounded/md → 6px
- tw/rounded/full → 9999px
```

**Technical Notes:**
- Use Tailwind's default config
- Convert rem to px (assume 16px base)
- Bundle data (no dependencies)

---

#### Feature 1.3: Library Selection UI
**Priority:** P0 (Must-have)

**User Story:**
> "As a designer, I want to choose between different design libraries so I can pick the one that fits my project."

**Acceptance Criteria:**
- [ ] Welcome screen shows library options
- [ ] User can choose: Radix, Tailwind, Material, Custom
- [ ] Each library shows description + token count
- [ ] Clicking library opens selection screen
- [ ] Back button returns to library selection

**Design:**
```
┌─────────────────────────────────────┐
│   Atom63 Design System Generator    │
├─────────────────────────────────────┤
│                                     │
│   Generate your design system:      │
│                                     │
│   ┌───────────────────────────┐    │
│   │ 🎨 Radix Colors           │    │
│   │ Modern, accessible        │    │
│   │ 300+ tokens               │    │
│   │ [Select →]                │    │
│   └───────────────────────────┘    │
│                                     │
│   ┌───────────────────────────┐    │
│   │ 🎨 Tailwind CSS           │    │
│   │ Popular utility-first     │    │
│   │ 335+ tokens               │    │
│   │ [Select →]                │    │
│   └───────────────────────────┘    │
│                                     │
│   ┌───────────────────────────┐    │
│   │ 🎨 Custom Palette         │    │
│   │ Generate from your colors │    │
│   │ Smart algorithm           │    │
│   │ [Select →]                │    │
│   └───────────────────────────┘    │
│                                     │
│   ┌───────────────────────────┐    │
│   │ 📁 Import JSON            │    │
│   │ Use existing tokens       │    │
│   │ [Import →]                │    │
│   └───────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

#### Feature 1.4: Preview & Confirmation
**Priority:** P0 (Must-have)

**User Story:**
> "As a designer, I want to preview all tokens before importing so I can verify they're correct."

**Acceptance Criteria:**
- [ ] Preview shows all tokens organized by category
- [ ] Color tokens show visual swatches
- [ ] Spacing tokens show pixel values
- [ ] Token count displayed per category
- [ ] User can deselect individual tokens
- [ ] "Generate" button shows final count
- [ ] Preview is scrollable for large sets

**Design:**
```
┌──────────────────────────────────────┐
│ ← Back    Preview: Radix Colors      │
├──────────────────────────────────────┤
│ 📊 36 tokens ready to import         │
│                                      │
│ ☑ Blue (12 tokens)  [Collapse ▼]    │
│ ┌────────────────────────────────┐  │
│ │ Light Mode:                    │  │
│ │ ☑ radix/blue/1  ████ #fbfdff   │  │
│ │ ☑ radix/blue/2  ████ #f4faff   │  │
│ │ ☑ radix/blue/3  ████ #e6f4fe   │  │
│ │ ... (9 more)                   │  │
│ │                                │  │
│ │ Dark Mode:                     │  │
│ │ ☑ radix/blue/1  ████ #0d1520   │  │
│ │ ... (11 more)                  │  │
│ └────────────────────────────────┘  │
│                                      │
│ ☑ Slate (12 tokens) [Expand ▶]      │
│                                      │
│ [Deselect All] [Generate 36 Tokens] │
└──────────────────────────────────────┘
```

---

### Phase 2: Custom Palette Generator (⭐ Differentiator)
**Goal:** Enable custom color palette generation with accessibility  
**Timeline:** 2-3 weeks  
**Status:** Planned

#### Feature 2.1: Basic Color Scale Generator
**Priority:** P0 (Must-have for MVP)

**User Story:**
> "As a designer, I want to generate a full color scale from a single color so I can create consistent shades without guessing."

**Acceptance Criteria:**
- [ ] User inputs primary brand color (hex picker)
- [ ] System generates 11 shades (50-950 scale)
- [ ] Preview shows all shades with values
- [ ] User can regenerate with different settings
- [ ] Generated colors are perceptually uniform
- [ ] Import creates Figma variables

**Design:**
```
┌──────────────────────────────────────┐
│ 🎨 Custom Palette Generator          │
├──────────────────────────────────────┤
│                                      │
│ Primary Color:                       │
│ ┌────────┐                           │
│ │ ████   │ #3B82F6 [🎨 Pick]        │
│ └────────┘                           │
│                                      │
│ Scale:                               │
│ ● 50-950 (11 shades)                 │
│ ○ 100-900 (9 shades)                 │
│                                      │
│ Name: [primary___________]           │
│                                      │
│ [Generate Preview ↓]                 │
│                                      │
│ ── Generated Palette ──              │
│                                      │
│ primary-50   ████████ #EFF6FF        │
│ primary-100  ████████ #DBEAFE        │
│ primary-200  ████████ #BFDBFE        │
│ primary-300  ████████ #93C5FD        │
│ primary-400  ████████ #60A5FA        │
│ primary-500  ████████ #3B82F6  ← input│
│ primary-600  ████████ #2563EB        │
│ primary-700  ████████ #1D4ED8        │
│ primary-800  ████████ #1E40AF        │
│ primary-900  ████████ #1E3A8A        │
│ primary-950  ████████ #172554        │
│                                      │
│ [← Adjust] [Generate Tokens →]      │
└──────────────────────────────────────┘
```

**Algorithm:**
- Start: Use HSL initially (simple, fast)
- Goal: Upgrade to OKLCH in Phase 3
- Method: Adjust lightness for each shade
  - 50: 95% lightness
  - 500: Base color (input)
  - 950: 15% lightness

**Technical Notes:**
```typescript
interface PaletteConfig {
  baseColor: string;        // "#3B82F6"
  name: string;             // "primary"
  scale: '50-950' | '100-900';
  algorithm: 'hsl' | 'oklch';  // Start with HSL
}

function generateScale(config: PaletteConfig): ColorScale {
  // Convert to HSL
  // Generate shades by adjusting L
  // Return hex values for each shade
}
```

---

#### Feature 2.2: Multi-Color Palette
**Priority:** P1 (Important)

**User Story:**
> "As a designer, I want to generate multiple color palettes at once so I can create a complete color system (primary, secondary, accent, etc.)."

**Acceptance Criteria:**
- [ ] User can add multiple base colors
- [ ] Each color gets its own scale
- [ ] User can name each palette
- [ ] Preview shows all palettes together
- [ ] User can remove individual palettes
- [ ] Generate creates all palettes as Figma variables

**Design:**
```
┌──────────────────────────────────────┐
│ 🎨 Multi-Color Palette Generator     │
├──────────────────────────────────────┤
│                                      │
│ ┌─ Primary ─────────────────────┐   │
│ │ ████ #3B82F6  [🎨] [Preview]  │   │
│ │ → 11 shades                    │   │
│ └────────────────────────────────┘   │
│                                      │
│ ┌─ Secondary ───────────────────┐   │
│ │ ████ #10B981  [🎨] [Preview]  │   │
│ │ → 11 shades                    │   │
│ └────────────────────────────────┘   │
│                                      │
│ [+ Add Color]                        │
│                                      │
│ Total: 22 color tokens               │
│                                      │
│ [Preview All] [Generate Tokens]      │
└──────────────────────────────────────┘
```

---

#### Feature 2.3: Dark Mode Auto-Generation
**Priority:** P1 (Important)

**User Story:**
> "As a designer, I want to automatically generate a dark mode palette so I don't have to manually adjust colors."

**Acceptance Criteria:**
- [ ] Checkbox: "Generate dark mode palette"
- [ ] System creates inverted scale for dark mode
- [ ] Both modes shown in preview
- [ ] Import creates two modes in collection
- [ ] User can toggle between mode previews

**Design:**
```
┌──────────────────────────────────────┐
│ Options:                             │
│ ☑ Generate dark mode palette         │
│ ☑ Maintain color relationships       │
│                                      │
│ ── Light Mode ──    ── Dark Mode ──  │
│ 50  ████ #EFF6FF    50  ████ #172554 │
│ 500 ████ #3B82F6    500 ████ #3B82F6 │
│ 950 ████ #172554    950 ████ #EFF6FF │
└──────────────────────────────────────┘
```

**Algorithm:**
- Invert lightness scale
- Maintain hue and saturation
- Adjust for readability

---

### Phase 3: Advanced Generation (🚀 Premium)
**Goal:** Professional features that justify paid tier  
**Timeline:** 4-6 weeks  
**Status:** Planned

#### Feature 3.1: OKLCH Color Algorithm
**Priority:** P1 (Premium differentiator)

**User Story:**
> "As a designer who cares about color science, I want perceptually uniform color scales so my designs look professional."

**Why OKLCH:**
- Perceptually uniform (HSL is not)
- Better for accessibility calculations
- Modern standard (CSS Color 4)
- Used by Tailwind 4.0+

**Acceptance Criteria:**
- [ ] Toggle between HSL and OKLCH algorithms
- [ ] OKLCH produces perceptually uniform scales
- [ ] Side-by-side comparison in preview
- [ ] Educational tooltip explaining benefits
- [ ] Premium feature indicator

**Technical Notes:**
- Use culori library for OKLCH calculations
- Fallback to HSL for older browsers (export)
- Performance: Pre-calculate common scales

---

#### Feature 3.2: Accessibility Validation
**Priority:** P1 (Premium differentiator)

**User Story:**
> "As a designer, I want to ensure my color combinations meet WCAG standards so my designs are accessible."

**Acceptance Criteria:**
- [ ] Real-time contrast ratio calculation
- [ ] Show which combinations pass WCAG AA/AAA
- [ ] Suggest best text color for each background
- [ ] Warn about failing combinations
- [ ] Auto-adjust option to meet standards
- [ ] Export includes accessibility metadata

**Design:**
```
┌──────────────────────────────────────┐
│ ✓ Accessibility Check                │
├──────────────────────────────────────┤
│                                      │
│ Text on Backgrounds:                 │
│                                      │
│ White text on primary-600            │
│ ✓ WCAG AAA (12.5:1) Normal text     │
│ ✓ WCAG AAA (12.5:1) Large text      │
│                                      │
│ Black text on primary-200            │
│ ✓ WCAG AA (7.2:1) Normal text       │
│ ⚠ WCAG AA (7.2:1) Large text only   │
│                                      │
│ ☑ Auto-adjust colors to meet AAA    │
│                                      │
│ [View Full Report]                   │
└──────────────────────────────────────┘
```

**Calculations:**
- Contrast ratio: (L1 + 0.05) / (L2 + 0.05)
- WCAG AA: 4.5:1 (normal), 3:1 (large)
- WCAG AAA: 7:1 (normal), 4.5:1 (large)

---

#### Feature 3.3: Semantic Token Generation
**Priority:** P2 (Nice-to-have)

**User Story:**
> "As a designer, I want semantic tokens (primary, success, danger) automatically generated so I have a complete design system."

**Semantic Tokens:**
```
From base palette → Generate semantic tokens:

primary-50     →  bg-primary-subtle
primary-100    →  bg-primary-muted
primary-600    →  bg-primary
primary-700    →  bg-primary-hover
primary-900    →  text-primary

+ Similar for:
- Success (green)
- Error (red)
- Warning (yellow)
- Info (blue)
- Neutral (gray)
```

**Acceptance Criteria:**
- [ ] Option to "Generate semantic tokens"
- [ ] Automatic mapping to common patterns
- [ ] User can customize mappings
- [ ] Preview shows both raw and semantic tokens
- [ ] Export includes both sets

---

#### Feature 3.4: Template Library
**Priority:** P2 (Nice-to-have)

**User Story:**
> "As a designer, I want pre-made design system templates so I can start with professional defaults."

**Templates:**

1. **SaaS App**
   - Radix Blue + Slate
   - Modern, professional
   - Soft border radius
   - Generous spacing

2. **Marketing Site**
   - Vibrant colors
   - Large typography scale
   - Bold shadows
   - Wide spacing

3. **Dashboard/Analytics**
   - Neutral palette
   - Compact spacing
   - Data visualization colors
   - High contrast

4. **E-commerce**
   - Warm colors
   - Product-focused
   - Trust signals (green, badges)

**Acceptance Criteria:**
- [ ] 4+ templates available
- [ ] Preview shows sample UI with template
- [ ] User can customize template before generating
- [ ] Templates include full system (colors, spacing, type, effects)

**Design:**
```
┌──────────────────────────────────────┐
│ 📦 Quick Start Templates             │
├──────────────────────────────────────┤
│                                      │
│ ┌────────────────────────────────┐  │
│ │ SaaS App                       │  │
│ │ [Preview Image]                │  │
│ │ • Radix Blue + Slate           │  │
│ │ • Modern, professional         │  │
│ │ • 187 tokens                   │  │
│ │ [Use Template →]               │  │
│ └────────────────────────────────┘  │
│                                      │
│ [Show all 4 templates...]            │
│                                      │
│ [Custom] for full control            │
└──────────────────────────────────────┘
```

---

### Phase 4: Sync & Maintenance (🔄 Complete Loop)
**Goal:** Complete bidirectional sync workflow  
**Timeline:** 2-3 weeks  
**Status:** Planned

#### Feature 4.1: Export to JSON
**Priority:** P0 (Must-have for v1.0)

**User Story:**
> "As a design system lead, I want to export my Figma variables to JSON so developers can use them in code."

**Acceptance Criteria:**
- [ ] User selects collections to export
- [ ] Choose format: Style Dictionary, Tailwind, CSS vars, Simple JSON
- [ ] Preview export before download
- [ ] Copy to clipboard option
- [ ] Download as file
- [ ] Export includes all modes

**Formats:**

**Simple JSON:**
```json
{
  "colors": {
    "primary": {
      "50": "#eff6ff",
      "500": "#3b82f6"
    }
  }
}
```

**Style Dictionary:**
```json
{
  "color": {
    "primary": {
      "50": {
        "value": "#eff6ff",
        "type": "color"
      }
    }
  }
}
```

**CSS Variables:**
```css
:root {
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
}
```

**Tailwind Config:**
```javascript
module.exports = {
  theme: {
    colors: {
      primary: {
        50: '#eff6ff',
        500: '#3b82f6'
      }
    }
  }
}
```

---

#### Feature 4.2: Batch Edit Existing Variables
**Priority:** P1 (High value for existing users)

**User Story:**
> "As a design system lead, I want to batch rename/update variables so I can maintain our system efficiently."

**Acceptance Criteria:**
- [ ] Load existing variable collections
- [ ] Bulk rename with find/replace
- [ ] Bulk value updates (e.g., multiply all spacing by 1.5)
- [ ] Preview changes before applying
- [ ] Undo support
- [ ] Filter by collection/type

**Operations:**
1. **Find & Replace**
   - Find: `color-` → Replace: `colors/`
   - Regex support

2. **Prefix/Suffix**
   - Add `v2-` prefix to all variables
   - Add `-deprecated` suffix

3. **Value Transform**
   - Multiply all spacing by 1.5
   - Shift all colors (hue +10)
   - Round all values

4. **Reorganize**
   - Move variables between collections
   - Change mode assignments

**Design:**
```
┌──────────────────────────────────────┐
│ 🔧 Batch Edit Variables              │
├──────────────────────────────────────┤
│                                      │
│ Collection: [Imported Tokens ▼]     │
│ Type: [All Types ▼]                 │
│                                      │
│ Operation:                           │
│ ● Find & Replace                     │
│ ○ Prefix/Suffix                      │
│ ○ Value Transform                    │
│ ○ Move to Collection                 │
│                                      │
│ ── Find & Replace ──                 │
│ Find:    [color-_______________]     │
│ Replace: [colors/______________]     │
│ ☐ Use regex                          │
│                                      │
│ 📊 23 variables will be affected     │
│                                      │
│ [Preview Changes ↓]                  │
│                                      │
│ color-primary → colors/primary  ✓    │
│ color-secondary → colors/secondary ✓ │
│ ... (21 more)                        │
│                                      │
│ [← Cancel] [Apply Changes]           │
└──────────────────────────────────────┘
```

---

#### Feature 4.3: Sync Configuration
**Priority:** P2 (Team feature)

**User Story:**
> "As a design system lead, I want to save my import/export configuration so my team can use the same settings."

**Acceptance Criteria:**
- [ ] Save configuration as JSON
- [ ] Load configuration from JSON
- [ ] Share configuration with team
- [ ] Configuration includes: formats, naming conventions, mappings
- [ ] Version control friendly (JSON)

**Configuration Format:**
```json
{
  "name": "Acme Design System",
  "version": "1.0",
  "import": {
    "libraries": ["radix-blue", "radix-slate"],
    "namingConvention": "kebab-case",
    "prefix": "ds-"
  },
  "export": {
    "format": "style-dictionary",
    "includeMetadata": true
  }
}
```

---

### Phase 5: Polish & Premium (💎 Launch Ready)
**Timeline:** 2-3 weeks  
**Status:** Pre-launch

#### Feature 5.1: Onboarding Flow
**Priority:** P0 (Essential for launch)

**First-time user experience:**

**Step 1: Welcome**
```
┌──────────────────────────────────────┐
│   Welcome to Atom63 Design System!   │
│                                      │
│   Generate professional design       │
│   systems in minutes                 │
│                                      │
│   [Get Started →]  [Watch Demo]      │
└──────────────────────────────────────┘
```

**Step 2: Quick Tutorial**
- Show 3 main use cases with screenshots
- Interactive tour (3 steps)
- Skip option

**Step 3: Choose Path**
- Generate from library (recommended)
- Import existing JSON
- Start custom

---

#### Feature 5.2: Help & Documentation
**Priority:** P1

- [ ] In-app tooltips
- [ ] Video tutorials
- [ ] Example files
- [ ] FAQ section
- [ ] Support link
- [ ] Keyboard shortcuts
- [ ] Search documentation

---

#### Feature 5.3: Pro Features UI
**Priority:** P0 (For monetization)

**Free tier indicators:**
```
┌──────────────────────────────────────┐
│ Algorithm:                           │
│ ● HSL (Basic)                        │
│ ○ OKLCH (Perceptually uniform) 👑   │
│                                      │
│ [Upgrade to Pro] for OKLCH + more    │
└──────────────────────────────────────┘
```

**Pro features badge:**
- 👑 icon for premium features
- Tooltip explaining benefit
- One-click upgrade flow
- Trial option (7 days)

---

## 📊 Success Metrics

### North Star Metric
**Time to First Design System**
- Target: < 5 minutes (90th percentile)
- Current baseline: 2-4 hours (manual)
- Measurement: Plugin open → Variables created in Figma

---

### Adoption Metrics

**Month 1-3 Goals:**
- 1,000+ installs
- 500+ weekly active users
- 100+ design systems generated
- 50+ exports to JSON

**Leading Indicators:**
- Plugin install rate
- Activation rate (generates tokens within 7 days)
- Retention (returns after 7 days)

---

### Quality Metrics

**Generated Systems:**
- 100% WCAG AAA compliant (with accessibility features)
- 0 reported color contrast issues
- < 1% error rate on generation
- < 5% user changes before importing

**Performance:**
- < 3 seconds to generate 300 tokens
- < 5 seconds to import to Figma
- < 1 second to preview changes

---

### Revenue Metrics (Post-launch)

**Conversion Goals:**
- 10% free → pro conversion (Month 4-6)
- $9-19/month price point
- Target: $5k MRR by Month 6

**Key Indicators:**
- Trial start rate
- Trial → paid conversion
- Churn rate (<5% monthly)
- Upgrade triggers (which features drive upgrades)

---

### User Satisfaction

**Qualitative:**
- NPS score > 50
- 4.5+ star rating (Figma Community)
- Positive feedback themes
- Feature requests (prioritization input)

**Behavioral:**
- Features most used
- Drop-off points in funnel
- Time spent per session
- Repeat usage patterns

---

## 💰 Monetization Strategy

### Business Model: Freemium

**Free Tier: "Community"**
- Import JSON (unlimited)
- Basic palette generator (HSL)
- Radix Colors (3 palettes max per generation)
- Tailwind Colors (basic palette only)
- Export to simple JSON
- Community support

**Target:** Hobbyists, students, solo designers on personal projects

---

**Pro Tier: "Professional" - $12/month or $99/year**
- ✓ Everything in Free
- ✓ Advanced palette generator (OKLCH)
- ✓ Accessibility validation (WCAG)
- ✓ Unlimited Radix palettes
- ✓ Full Tailwind import (all utilities)
- ✓ Dark mode auto-generation
- ✓ Semantic token generation
- ✓ Template library (4+ templates)
- ✓ Export to all formats (Style Dictionary, Tailwind, CSS)
- ✓ Batch edit operations
- ✓ Save/load configurations
- ✓ Priority support
- ✓ Early access to new features

**Target:** Professional designers, design system leads, design teams

---

**Enterprise Tier: "Teams" - $49/month (5+ seats)**
- ✓ Everything in Pro
- ✓ Team workspace
- ✓ Shared configurations
- ✓ Usage analytics
- ✓ Custom templates
- ✓ Dedicated support
- ✓ Training & onboarding

**Target:** Design teams at companies (10+ designers)

---

### Pricing Rationale

**Market Research:**
- Tokens Studio: $9/month
- Similar design tools: $10-20/month
- Figma itself: $12/editor/month

**Value Proposition:**
- Saves 2+ hours per project
- Professional results
- Accessibility built-in
- Worth $12/month if used 1-2x/month

**Free Tier Purpose:**
- Viral growth
- Community building
- Feedback & testing
- Upgrade funnel

---

### Revenue Projections (Conservative)

**Assumptions:**
- 1,000 installs by Month 3
- 30% activation rate (use plugin)
- 10% free → pro conversion (Month 6)
- $12/month average (mix of monthly/yearly)

**Month 6:**
- 1,000 installs × 30% = 300 active users
- 300 × 10% = 30 pro users
- 30 × $12 = $360 MRR

**Month 12:**
- 5,000 installs × 30% = 1,500 active users
- 1,500 × 12% = 180 pro users
- 180 × $12 = $2,160 MRR

**Year 2:**
- Target: 10,000+ active users
- Target: $10k MRR

---

## 🚀 Go-to-Market Strategy

### Launch Plan

#### Pre-launch (Weeks 1-4)
**Goal:** Build anticipation, gather early feedback

- [ ] Create landing page (with email signup)
- [ ] Post on Designer News, Figma Community forums
- [ ] Reach out to design system communities
- [ ] Beta program (50 users)
- [ ] Create demo video (2-3 minutes)
- [ ] Write launch blog post

**Content:**
- "How we built a design system generator"
- "Why OKLCH is the future of color"
- "Radix Colors in Figma: A complete guide"

---

#### Launch Day (Week 5)
**Goal:** Maximum visibility, first 100 users

- [ ] Publish to Figma Community
- [ ] Post on:
  - Product Hunt (prepare campaign)
  - Hacker News
  - Reddit (r/FigmaDesign, r/web_design)
  - Twitter/X (design community)
  - Designer News
  - Indie Hackers

- [ ] Email beta users
- [ ] Personal network outreach
- [ ] Demo video on YouTube

**Launch Post Template:**
```
"Atom63 Design System Generator: Create professional design systems in Figma in under 5 minutes

🎨 One-click Radix & Tailwind import
🌈 Smart color palette generator
♿ Accessibility validation built-in
🔄 Full import/export workflow

We built this because [pain point story]. 
After 100+ hours of development, it's ready for the community.

Free tier available. Feedback welcome!
[Link]
```

---

#### Post-Launch (Weeks 6-12)
**Goal:** Sustain momentum, iterate, convert

**Week 6-7: Feedback & Iteration**
- Monitor usage analytics
- Collect user feedback
- Fix critical bugs
- Ship quick wins

**Week 8-9: Content Marketing**
- Tutorial videos (YouTube)
- Blog posts (design system best practices)
- Case studies (if users willing)
- Comparison guides (vs Tokens Studio)

**Week 10-12: Growth**
- Outreach to design influencers
- Podcast appearances
- Conference talk submissions (Future of Design Systems)
- Partnership exploration (Radix, Tailwind communities)

---

### Distribution Channels

**Primary:**
1. **Figma Community** (discover & install)
2. **Product Hunt** (tech-savvy early adopters)
3. **Design Twitter/X** (design community)

**Secondary:**
4. **Reddit** (design subreddits)
5. **YouTube** (tutorial creators)
6. **Design newsletters** (Sidebar, Designer News)
7. **Design Discord servers**

**Long-term:**
8. **SEO** (design system blog)
9. **Partnerships** (Radix, Tailwind official?)
10. **Conference talks**

---

### Marketing Messages

**For Solo Designers:**
> "Skip the busywork. Generate professional design systems in 5 minutes with Radix Colors, Tailwind presets, and smart accessibility checks. Free to start."

**For Design System Leads:**
> "Keep your Figma variables in sync with code. Import from JSON, batch edit 100+ variables, export to any format. Built for maintainers."

**For Developers Who Design:**
> "Use Tailwind colors in Figma. One-click import, perfect pixel matching, export back to code. No design knowledge needed."

---

## 🗺️ Roadmap

### Q4 2025 (Current)

**October:**
- [x] Foundation complete (import, editing)
- [ ] PRD finalized
- [ ] Phase 1 start: Library presets
- [ ] Radix Colors integration

**November:**
- [ ] Phase 1 complete: Radix + Tailwind
- [ ] Phase 2 start: Custom palette generator
- [ ] Basic color scale generation
- [ ] Beta launch (50 users)

**December:**
- [ ] Phase 2 complete: Advanced generation
- [ ] OKLCH algorithm
- [ ] Accessibility validation
- [ ] Public launch (Figma Community)

---

### Q1 2026

**January:**
- [ ] Phase 4: Export to JSON
- [ ] Batch edit enhancements
- [ ] Gather launch feedback
- [ ] Iterate based on usage

**February:**
- [ ] Template library
- [ ] Semantic token generation
- [ ] Pro tier launch
- [ ] Payment integration (Gumroad/Stripe)

**March:**
- [ ] Polish & bug fixes
- [ ] Performance optimization
- [ ] Marketing push
- [ ] Target: 1,000 active users

---

### Q2 2026 (Future)

**April-June:**
- [ ] Team features exploration
- [ ] Configuration sync
- [ ] API/CLI tool?
- [ ] Enterprise tier
- [ ] Plugin ecosystem (allow extensions?)

---

## 🎯 Success Criteria

### MVP Success (Launch - Month 1)
- ✅ 100+ installs
- ✅ 50+ active users (generate tokens)
- ✅ 4.0+ rating on Figma Community
- ✅ 10+ positive testimonials
- ✅ < 5% error rate

### Product-Market Fit (Month 3-6)
- ✅ 1,000+ installs
- ✅ 500+ weekly active users
- ✅ 30%+ activation rate
- ✅ 40%+ return rate (use 2+ times)
- ✅ Organic word-of-mouth growth
- ✅ Featured on Figma Community?

### Sustainable Product (Month 6-12)
- ✅ 10% free → pro conversion
- ✅ $2k+ MRR
- ✅ < 5% monthly churn
- ✅ 100+ pro subscribers
- ✅ Profitable (cover costs)
- ✅ Roadmap informed by user feedback

---

## 📝 Open Questions & Decisions Needed

### Product Questions

1. **OKLCH Implementation**
   - Library: culori vs custom implementation?
   - Performance: Pre-calculate or on-demand?
   - Fallback: HSL for non-supporting browsers?

2. **Accessibility Validation**
   - How strict? Warn vs Block?
   - Auto-fix option or manual only?
   - WCAG AA vs AAA default?

3. **Templates**
   - How many templates for v1.0?
   - Allow user-created templates?
   - Community template sharing?

4. **Pricing**
   - $9, $12, or $15/month?
   - Monthly-only or annual discount?
   - Lifetime deal for early adopters?

---

### Technical Questions

1. **Export Formats**
   - Which format is most important first?
   - Support CSS Color 4 (oklch()) in export?
   - TypeScript types generation?

2. **Data Storage**
   - Where to store user presets? (Figma plugin storage, cloud?)
   - Team sync: Need backend or file-based?

3. **Performance**
   - Target: 300 tokens in < 3 seconds?
   - Lazy loading for large previews?
   - Web workers for heavy calculations?

---

### Business Questions

1. **Launch Timing**
   - Launch with Free only, add Pro later?
   - Or launch Free + Pro together?
   - Beta period length?

2. **Support Strategy**
   - Email support only?
   - Discord community?
   - Documentation site needed?

3. **Legal**
   - Terms of service
   - Privacy policy
   - Commercial license for bundled data (Radix, Tailwind)

---

## 📚 Appendix

### Technical Stack

**Frontend (Plugin UI):**
- React 18
- TypeScript
- esbuild (bundler)
- Custom CSS (Figma design system style)

**Color Libraries:**
- culori (OKLCH calculations)
- @radix-ui/colors (Radix palette data)
- tailwindcss (Tailwind config data)

**Figma API:**
- Variables API (create, read, update)
- Plugin API (storage, UI)

---

## 🚧 Current Implementation Status

### What's Supported ✅

#### Figma Variables (Full Support)
- **Import**: Create variables from JSON design tokens
- **Export**: Export variables to JSON format
- **Multi-collection**: Import/export multiple collections
- **Modes**: Support for variable modes (Light/Dark, etc.)
- **References**: Variable aliases and references
- **Types Supported**:
  - `COLOR` - Color values
  - `FLOAT` - Numbers (spacing, sizing, border radius, etc.)
  - `STRING` - Text values (font families, etc.)

#### Color Formats
- **Import**: HEX, RGB, RGBA, HSL, HSLA, OKLCH
- **Export**: OKLCH (default), HEX, RGBA
- **Conversion**: Automatic format conversion

#### Features
- Change tracking (created/updated/unchanged)
- Override mode for safe updates
- Selective collection import
- Variable descriptions
- Nested token structures

### What's NOT Supported ❌

#### Figma Styles (Not Implemented)
The plugin currently **only works with Variables**, not Styles:

**Cannot Import/Export:**
- ❌ Color Styles
- ❌ Text Styles  
- ❌ Effect Styles (shadows, blurs)
- ❌ Grid Styles

**Why Styles Are Not Supported:**
1. **Variables are newer** - Figma's modern design token system
2. **Better for tokens** - Variables support modes, references, and semantic naming
3. **Industry direction** - Design tokens ecosystem uses Variables format
4. **Scope decision** - Focus on Variables for MVP, Styles support deferred

**Workaround:**
- Manually convert Styles to Variables in Figma
- Use Variables instead of Styles for new design systems
- Third-party plugins exist for Style migration

#### Other Limitations
- ❌ Cannot import images/assets
- ❌ Cannot create components
- ❌ Cannot modify existing Styles
- ❌ No support for gradient variables
- ❌ No support for boolean variables
- ❌ Cannot read/modify layer properties directly

### Migration Path: Styles → Variables

If you have existing Color/Text Styles:

1. **Manual Migration** (Figma UI):
   - Select style → Create variable from style
   - Batch operations available in Figma

2. **Third-party Plugins**:
   - "Variables Importer" - Convert styles to variables
   - "Style Organizer" - Bulk style operations

3. **Why Migrate**:
   - Variables support modes (Light/Dark)
   - Variables work with this plugin
   - Variables are the future of Figma design systems

### Technical Details

**Figma API Used:**
- `figma.variables.*` - Variables API (full support)
- `figma.getLocalVariableCollections()` - Read collections
- `figma.variables.createVariable()` - Create variables
- `figma.variables.getVariableById()` - Reference resolution

**Figma API NOT Used:**
- `figma.getLocalPaintStyles()` - Styles API (not implemented)
- `figma.getLocalTextStyles()` - Text Styles (not implemented)
- `figma.getLocalEffectStyles()` - Effect Styles (not implemented)

---

### Resources

**Design Systems:**
- [Radix Colors Documentation](https://www.radix-ui.com/colors)
- [Tailwind CSS Default Theme](https://tailwindcss.com/docs/theme)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)

**Color Science:**
- [OKLCH Color Space](https://oklch.com/)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Perceptually Uniform Color Spaces](https://programmingdesignsystems.com/color/perceptually-uniform-color-spaces/)

**Figma Documentation:**
- [Figma Variables Documentation](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)
- [Variables API Reference](https://www.figma.com/plugin-docs/api/Variable/)
- [Styles vs Variables Guide](https://help.figma.com/hc/en-us/articles/360039820134-Styles-in-Figma)

**Competition:**
- [Tokens Studio](https://tokens.studio/)
- [Variables Import Export](https://www.figma.com/community/plugin/1234567890)

---

## ✅ Next Steps

**Immediate (This Week):**
1. [x] PRD finalized and reviewed
2. [ ] Technical spike: OKLCH algorithm feasibility
3. [ ] Design UI mockups for library selector
4. [ ] Set up analytics (track plugin usage)
5. [ ] Bundle Radix Colors data

**Next Week:**
1. [ ] Implement Radix Colors selector UI
2. [ ] Implement preview component
3. [ ] Add generate & import flow
4. [ ] Write tests for color generation
5. [ ] Update documentation

**This Month:**
1. [ ] Complete Phase 1 (Library presets)
2. [ ] Start Phase 2 (Custom palette)
3. [ ] Recruit beta testers
4. [ ] Create demo video
5. [ ] Set up landing page

---

**Document Version:** 1.0  
**Status:** Living document - update as product evolves  
**Next Review:** Weekly during active development

---

*Built with ❤️ for the design community*

