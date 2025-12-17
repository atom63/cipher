# Product Requirements Document: Cipher

**Version:** 2.0  
**Last Updated:** December 16, 2024  
**Status:** Active Development  
**Owner:** You Zhang (ATOM63)

---

## 🎯 Executive Summary

**Cipher** is a Figma plugin that bridges the gap between design and code through **intelligent design token management**. It enables designers and developers to import, export, and generate design system tokens with automatic CSS generation, opacity support, and seamless Figma Variables integration.

### The Problem
- **Design-Dev Disconnect**: Design tokens exist in code (JSON/CSS) but manually syncing to Figma is error-prone
- **Token Generation Complexity**: Creating comprehensive token systems (primitives → semantics) requires deep knowledge
- **Opacity Loss**: Figma opacity values are lost when exporting to code
- **No Automation**: Existing tools require manual CSS generation from token JSON

### The Solution
- **Bidirectional Sync**: Import JSON tokens → Figma Variables, Export Figma Variables → CSS
- **Intelligent Generation**: Automatic CSS generation with proper prefixes, opacity mixing, and Tailwind compatibility
- **Future-Proof Architecture**: 4-layer token system (primitives, abstractions, semantics, responsive)
- **Dynamic Opacity Support**: Automatically detects and applies opacity from Figma using `color-mix()`

### Unique Value Proposition
**First plugin to combine JSON import + automatic CSS generation + opacity preservation + zero-config token generation**

---

## 🎪 Product Vision

### Vision Statement
*"Design systems should flow effortlessly between design and code, with zero manual configuration."*

### Mission
Eliminate manual token synchronization, preserve design intent (especially opacity), and provide a professional token generation system that adapts to any design system architecture.

### Product Goals (6 months)
1. **Adoption**: 1,000+ active plugin users
2. **Quality**: 100% accurate opacity preservation from Figma
3. **Automation**: Zero manual CSS writing for token consumers
4. **Flexibility**: Support any token architecture (primitives, semantics, custom)

---

## 👥 Target Users

### Primary: Design System Engineers
- Maintain design tokens in both Figma and code
- Need bidirectional sync workflow
- Value automation and accuracy
- **Pain**: Manual CSS generation and opacity handling

### Secondary: Product Designers
- Create design systems in Figma
- Export tokens for developer handoff
- Need professional token structure
- **Pain**: No easy way to generate production-ready CSS

### Tertiary: Frontend Developers
- Import design tokens into Figma for design work
- Need exact color values with opacity
- Prefer code-friendly formats
- **Pain**: Figma opacity not translating to CSS

---

## 🏗️ Product Architecture

### 4-Layer Token System

```
primitives/      → Raw values (colors, spacing, typography)
  ├─ color/      → Base color palettes (zinc, blue, etc.)
  ├─ spacing/    → Spacing scale (0, 0.5, 1, 2, etc.)
  ├─ typography/ → Font sizes, weights, line heights
  └─ radius/     → Border radius values

abstractions/    → Semantic mappings
  ├─ surface/    → {primitives.color.zinc.*}
  └─ primary/    → {primitives.color.blue.*}

semantics/       → Context-aware tokens (with modes)
  ├─ background/ → Light & Dark mode specific
  ├─ foreground/ → Adaptive text colors
  └─ shadcn/     → Framework-specific tokens

responsive/      → Viewport-aware tokens
  └─ typography/ → Mobile, tablet, desktop scales
```

### Token Generation Flow

```mermaid
Figma Export → tokens.json + styles.json
                    ↓
            scripts/generate-tokens.ts
                    ↓
     ┌──────────────┴──────────────┐
     ↓                             ↓
Dynamic Opacity Detection    Token Resolution
(traverses styles.json)      (resolves references)
     ↓                             ↓
     └──────────────┬──────────────┘
                    ↓
         Generate CSS with:
         - CSS Variables
         - color-mix() for opacity
         - @theme inline blocks
         - Proper prefixes
                    ↓
         Output: tokens/styles/
         - primitives.css
         - abstractions.css
         - semantics.css
         - responsive.css
```

---

## ✅ Current Implementation Status

### What's Built (Phase 0-1) ✅

#### Core Features
- ✅ **JSON Import**: Parse design tokens and create Figma Variables
- ✅ **Multi-collection Support**: Import multiple token collections
- ✅ **Mode Support**: Light/Dark themes and responsive breakpoints
- ✅ **Type Support**: COLOR, FLOAT, STRING variable types
- ✅ **Token References**: Resolve `{primitives.zinc.50}` style references
- ✅ **Change Tracking**: Show created/updated/unchanged variables
- ✅ **Batch Operations**: Rename and edit multiple tokens

#### Token Generation System ✅
- ✅ **TypeScript-based**: Type-safe token parsing and generation
- ✅ **Dynamic Opacity Detection**: Automatically extracts opacity from `styles.json`
- ✅ **CSS Generation**: Creates production-ready CSS with:
  - Proper variable prefixes (--color-*, --spacing-*, etc.)
  - color-mix() for opacity (e.g., `color-mix(in srgb, var(--color), transparent 10%)`)
  - @theme inline blocks for Tailwind compatibility
  - Flattened shadcn- prefixes for clean variable names
- ✅ **Future-proof**: Zero hardcoding - adapts to any new token automatically
- ✅ **Watch Mode**: Auto-regenerate CSS on token changes

#### Technical Excellence
- ✅ **Fast**: Token generation in <1 second for 100+ tokens
- ✅ **Accurate**: 100 tokens with opacity discovered (vs 26 with manual mapping)
- ✅ **Maintainable**: Zero code changes needed for new tokens
- ✅ **Well-documented**: Comprehensive README and architecture docs

### What's NOT Supported ❌

#### Out of Scope (Design Decision)
- ❌ Figma Styles (Color/Text/Effect Styles) - Focus on Variables only
- ❌ Library Presets (Radix/Tailwind) - Use external token files instead
- ❌ Custom Palette Generator - Use existing design tools
- ❌ In-app Token Editor - Edit in JSON, regenerate CSS
- ❌ Cloud Sync - File-based workflow is sufficient

#### Why These Are Out of Scope
1. **Variables > Styles**: Figma's modern system, better for tokens
2. **Focus**: Master token sync workflow before generation features
3. **Simplicity**: File-based workflow is more reliable than cloud
4. **Ecosystem**: Let specialized tools handle palette generation

---

## 🚀 Feature Roadmap

### Phase 2: Export & Sync (Next - Q1 2025)

#### 2.1: Export Figma Variables to JSON
**Priority:** P0 (Critical)

**User Story:**
> "As a design system engineer, I want to export my Figma variables to JSON so developers can use them in code."

**Acceptance Criteria:**
- [ ] Export selected collections to JSON
- [ ] Preserve modes (Light/Dark, responsive)
- [ ] Maintain token references
- [ ] Include opacity information in export
- [ ] Generate matching `styles.json` for CSS generation

**Output Format:**
```json
{
  "$schema": "design-tokens-with-collections",
  "tokens": {
    "semantics": {
      "background": {
        "primary": {
          "rest": {
            "value": "{abstractions.surface.200}",
            "type": "color",
            "collection": "semantics",
            "modes": {
              "Light": "{abstractions.surface.200}",
              "Dark": "{abstractions.surface.800}"
            }
          }
        }
      }
    }
  }
}
```

---

#### 2.2: Live CSS Generation
**Priority:** P1 (Important)

**User Story:**
> "As a developer, I want to see generated CSS immediately after export so I can copy-paste into my project."

**Acceptance Criteria:**
- [ ] Generate CSS on export
- [ ] Show CSS preview in plugin UI
- [ ] Copy CSS to clipboard
- [ ] Download CSS files
- [ ] Multiple format options (CSS vars, Tailwind, SCSS)

**UI Design:**
```
┌─────────────────────────────────────┐
│ ✅ Exported 112 semantic tokens     │
│                                     │
│ 📄 Generated Files:                 │
│ ┌─────────────────────────────────┐│
│ │ semantics.css       (112 tokens)││
│ │ primitives.css      (475 tokens)││
│ │ abstractions.css    (192 tokens)││
│ └─────────────────────────────────┘│
│                                     │
│ [Copy CSS] [Download ZIP] [Preview]│
└─────────────────────────────────────┘
```

---

#### 2.3: Bidirectional Sync Workflow
**Priority:** P1 (Important)

**User Story:**
> "As a design system lead, I want changes in either Figma or code to sync seamlessly so my team stays in sync."

**Workflow:**
```
1. Import tokens.json → Figma Variables
2. Edit in Figma (add tokens, adjust colors)
3. Export from Figma → Updated tokens.json + styles.json
4. Run: bun run tokens → Generate CSS
5. Commit to git
```

**Acceptance Criteria:**
- [ ] Round-trip integrity (import → edit → export → import = same)
- [ ] Preserve custom metadata
- [ ] Git-friendly output (consistent formatting)
- [ ] Conflict detection (warn if manual edits detected)

---

### Phase 3: Advanced Features (Q2 2025)

#### 3.1: Batch Export Multiple Collections
- [ ] Select multiple collections for export
- [ ] Generate merged CSS or separate files
- [ ] Customizable export templates

#### 3.2: Token Validation
- [ ] Validate token references
- [ ] Check for circular dependencies
- [ ] Warn about missing modes
- [ ] Accessibility contrast checking

#### 3.3: Style Guide Generation
- [ ] Auto-generate HTML style guide from tokens
- [ ] Show color palettes with WCAG ratings
- [ ] Typography scale preview
- [ ] Spacing scale visualization

#### 3.4: CLI Tool (Future)
- [ ] Command-line tool for CI/CD integration
- [ ] `cipher generate --input tokens.json --output ./styles/`
- [ ] Watch mode for development
- [ ] Git hooks integration

---

## 🎨 UI/UX Principles

### Design Philosophy
1. **Zero Config**: Should just work without setup
2. **Transparency**: Show what will happen before it happens
3. **Reversibility**: Always allow undo/cancel
4. **Education**: Explain concepts inline for learning

### Key Interactions

**Import Flow:**
```
1. Upload JSON → 2. Preview Tokens → 3. Configure → 4. Import
   [File]         [Table View]       [Options]     [Progress]
```

**Export Flow:**
```
1. Select Collections → 2. Preview Output → 3. Export
   [Checkboxes]          [CSS Preview]      [Download]
```

### Visual Design
- **Figma-native**: Match Figma's UI patterns and colors
- **Minimal**: Don't over-design, focus on functionality
- **Responsive**: Handle large token sets gracefully
- **Accessible**: WCAG AA minimum, keyboard navigation

---

## 📊 Success Metrics

### North Star Metric
**Time from Figma Edit to Code Update**
- Target: <2 minutes (export → generate CSS → commit)
- Current manual: 30+ minutes
- Measurement: Export time + generation time

### Key Performance Indicators

**Adoption (Month 3):**
- 500+ plugin installs
- 100+ active weekly users
- 50+ GitHub stars (if open source)

**Quality:**
- 100% opacity preservation accuracy
- <1s CSS generation for 500 tokens
- Zero reported data loss incidents

**Engagement:**
- 70%+ users export within first session
- 40%+ users return after 7 days
- Average 3+ exports per active user/week

---

## 🛠️ Technical Architecture

### Stack
- **Plugin**: React 18, TypeScript, esbuild
- **Token Generation**: TypeScript (Node.js)
- **Build**: Bun for package management
- **Code Quality**: Ultracite (Biome)

### Key Technical Decisions

#### 1. **File-based Token System**
**Decision:** Use JSON files, not cloud database  
**Rationale:**
- Git-friendly (version control)
- No backend infrastructure needed
- Works offline
- Industry standard (Style Dictionary, etc.)

#### 2. **Dynamic Opacity Detection**
**Decision:** Auto-traverse styles.json vs hardcoded mappings  
**Rationale:**
- Future-proof for any new tokens
- More accurate (found 100 vs 26 tokens)
- Zero maintenance

#### 3. **Separate Token + Styles Files**
**Decision:** tokens.json (values) + styles.json (Figma metadata)  
**Rationale:**
- tokens.json is clean, code-friendly
- styles.json has Figma-specific data (opacity, gradients)
- Separation of concerns

#### 4. **TypeScript Generation Script**
**Decision:** TypeScript over JavaScript  
**Rationale:**
- Type safety prevents errors
- Better IDE support
- Consistent with plugin codebase
- Modern (ESM, async/await)

---

## 🚦 Release Strategy

### v0.1.0 - Foundation (Current) ✅
- JSON import to Figma Variables
- Token generation system
- Dynamic opacity support
- Documentation

### v0.2.0 - Export (Q1 2025)
- Export Figma Variables to JSON
- Live CSS preview
- Multiple export formats
- Batch operations

### v1.0.0 - Public Launch (Q2 2025)
- Bidirectional sync workflow
- Token validation
- Style guide generation
- Comprehensive documentation
- Community feedback integration

### v1.1.0 - Polish (Q2 2025)
- Performance optimizations
- Advanced batch operations
- CLI tool
- Plugin ecosystem hooks

---

## 📈 Go-to-Market

### Distribution
1. **Figma Community** (primary)
2. **GitHub** (open source potential)
3. **Design system communities** (Discord, Slack)
4. **Dev communities** (Reddit, HackerNews)

### Marketing Messages

**For Design System Teams:**
> "Cipher: Seamless design token sync between Figma and code. Export once, use everywhere. Zero configuration."

**For Developers:**
> "Turn Figma variables into production CSS in one click. Opacity preserved, Tailwind-compatible, type-safe."

**For Solo Designers:**
> "Professional design token workflow without the complexity. Import tokens, edit in Figma, export CSS. Simple."

---

## 🎯 Competitive Advantage

### vs Tokens Studio
- ✅ **Simpler**: File-based vs cloud config
- ✅ **Automated CSS**: Built-in generation, no build step
- ✅ **Opacity**: Automatic detection and preservation
- ❌ **Less features**: No GitHub sync (yet)

### vs Manual Workflow
- ✅ **100x faster**: 2 minutes vs 30+ minutes
- ✅ **Accurate**: No copy-paste errors
- ✅ **Consistent**: Guaranteed format adherence
- ✅ **Maintainable**: Changes tracked in git

### vs Variables Import/Export
- ✅ **CSS Generation**: Built-in, automatic
- ✅ **Opacity Support**: color-mix() generation
- ✅ **Professional**: Type-safe, tested codebase
- ✅ **Documented**: Comprehensive guides

---

## ❓ Open Questions

### Technical
1. **Export format priority?**
   - Simple JSON vs Style Dictionary vs both?
   - Decision: Simple JSON first, Style Dictionary v0.3.0

2. **CLI tool scope?**
   - Just generation or full sync?
   - Decision: Defer to v1.1.0

3. **Performance at scale?**
   - How many tokens before slowdown?
   - Target: 1000+ tokens <3s

### Product
1. **Free vs paid?**
   - Keep free forever or introduce paid tier?
   - Decision: Free forever, explore sponsorships

2. **Open source?**
   - MIT license or proprietary?
   - Decision: Open source after v1.0.0

3. **Community features?**
   - Token library sharing?
   - Decision: Defer to community demand

---

## 🎬 Next Steps

### This Week
- [ ] Update old PRD.md → Archive to docs/archive/
- [ ] Finalize export JSON format spec
- [ ] Design export UI mockups
- [ ] Set up telemetry (privacy-friendly)

### Next Sprint (2 weeks)
- [ ] Implement export to JSON
- [ ] Add CSS preview UI
- [ ] Write export tests
- [ ] Update documentation

### This Quarter
- [ ] Complete Phase 2 (Export & Sync)
- [ ] Beta testing with 10 users
- [ ] Performance optimization
- [ ] Prepare for v1.0.0 launch

---

## 📚 Resources

### Documentation
- [README.md](./README.md) - Getting started
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [Token Generation Guide](./docs/TOKEN-GENERATION-GUIDE.md) - How CSS generation works

### Figma
- [Variables API](https://www.figma.com/plugin-docs/api/Variable/)
- [Plugin Development](https://www.figma.com/plugin-docs/)

### Design Tokens
- [Design Tokens Format Module](https://design-tokens.github.io/community-group/format/)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [W3C Design Tokens](https://www.w3.org/community/design-tokens/)

---

**Status:** Living Document  
**Last Updated:** December 16, 2024  
**Next Review:** Weekly during active development

*Built with ❤️ for the design community*

