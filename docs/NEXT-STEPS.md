# Next Steps - Plugin Enhancement Plan

**Created:** December 16, 2024  
**Status:** Ready to Execute

---

## 🎯 Current Status Summary

### ✅ What's Already Working

**1. Import Flow (100% Complete)**
- Upload JSON → Parse → Review → Import ✅
- TokenTable with editing ✅
- Batch operations ✅
- Change tracking ✅

**2. Export Flow (80% Complete)**
- Select collections ✅
- Export to tokens.json ✅
- Color format selection (oklch/hex/rgba) ✅
- Auto-download ✅
- Nested structure support ✅

**3. CSS Generation (100% Complete - CLI)**
- Dynamic opacity detection ✅
- Multiple collections ✅
- @theme blocks ✅
- Watch mode ✅

---

## 🚀 Enhancement Plan (Priority Order)

### Phase 2.1: Export Enhancements (P0 - Critical)

**Goal:** Complete the export workflow to match import quality

#### Task 1: Dual Export (tokens.json + styles.json)
**Why:** Users need both files for CSS generation with opacity support

**Current:** Only exports tokens.json  
**Needed:** Also generate styles.json with Figma metadata

**Implementation:**
```typescript
// In export-handler.ts
export async function exportVariablesWithStyles(
  collectionIds: string[], 
  colorFormat: string
) {
  // 1. Generate tokens.json (already works)
  const tokens = await exportVariablesAsTokens(...)
  
  // 2. Generate styles.json (extract from Figma styles)
  const styles = await exportStylesAsTokens(...)
  
  // 3. Return both
  return { tokens, styles }
}
```

**Files to modify:**
- `handlers/export-handler.ts` - Add combined export function
- `code.ts` - Update export message handler
- `pages/ExportPage.tsx` - Download both files

**Acceptance Criteria:**
- [ ] Export generates 2 files: `tokens-{timestamp}.json` and `styles-{timestamp}.json`
- [ ] Both files have matching timestamp
- [ ] styles.json includes opacity data for all semantic tokens
- [ ] Round-trip test: Export → Import → Export produces identical files

**Time Estimate:** 4-6 hours

---

#### Task 2: Export Preview UI (P1)
**Why:** User should see JSON before download (matches import preview)

**Current:** Auto-downloads immediately  
**Needed:** Show preview → User confirms → Download

**Implementation:**
```tsx
// New component: ExportPreview.tsx
export function ExportPreview({ 
  tokensJson, 
  stylesJson,
  onDownload,
  onCancel 
}) {
  return (
    <div>
      <Tabs>
        <Tab label="tokens.json">
          <CodeBlock language="json">
            {JSON.stringify(tokensJson, null, 2)}
          </CodeBlock>
        </Tab>
        <Tab label="styles.json">
          <CodeBlock language="json">
            {JSON.stringify(stylesJson, null, 2)}
          </CodeBlock>
        </Tab>
      </Tabs>
      
      <Button onClick={onDownload}>Download Files</Button>
      <Button onClick={onCancel}>Cancel</Button>
    </div>
  )
}
```

**Files to modify:**
- Create `components/export/ExportPreview.tsx`
- Update `pages/ExportPage.tsx` - Add preview step

**Acceptance Criteria:**
- [ ] After export, show preview screen
- [ ] Syntax-highlighted JSON display
- [ ] Copy to clipboard button for each file
- [ ] Download button triggers both files
- [ ] Can go back and select different collections

**Time Estimate:** 3-4 hours

---

#### Task 3: CSS Preview Integration (P1)
**Why:** Show generated CSS immediately after export

**Current:** User must run `bun run tokens` manually  
**Needed:** Show CSS preview in plugin UI

**Implementation:**
```tsx
// Reuse the generate-tokens.ts logic in browser
import { generateCSSFromTokens } from '../scripts/generate-tokens'

function ExportSuccess({ tokens, styles }) {
  const [cssPreview, setCssPreview] = useState('')
  
  useEffect(() => {
    // Generate CSS from exported tokens
    const css = generateCSSFromTokens(tokens, styles)
    setCssPreview(css)
  }, [tokens, styles])
  
  return (
    <div>
      <h3>✅ Export Complete</h3>
      <Tabs>
        <Tab label="tokens.json">...</Tab>
        <Tab label="styles.json">...</Tab>
        <Tab label="Generated CSS">
          <CodeBlock language="css">{cssPreview}</CodeBlock>
          <Button onClick={() => copyToClipboard(cssPreview)}>
            Copy CSS
          </Button>
        </Tab>
      </Tabs>
    </div>
  )
}
```

**Files to modify:**
- Refactor `scripts/generate-tokens.ts` to be importable
- Create `utils/css-generator-browser.ts` (browser-compatible version)
- Update `pages/ExportPage.tsx` - Add CSS tab

**Acceptance Criteria:**
- [ ] After export, show "Generated CSS" tab
- [ ] Display CSS for each collection (primitives, semantics, etc.)
- [ ] Copy individual CSS files to clipboard
- [ ] Download CSS files alongside JSON
- [ ] Show token count and opacity count

**Time Estimate:** 6-8 hours

---

### Phase 2.2: UI/UX Polish (P1 - Important)

#### Task 4: Progress Steps Indicator
**Why:** User should always know where they are in the flow

```tsx
// ProgressSteps.tsx
function ProgressSteps({ currentStep }) {
  const steps = [
    { id: 'upload', label: 'Upload' },
    { id: 'collection', label: 'Select' },
    { id: 'review', label: 'Review' },
    { id: 'import', label: 'Import' },
    { id: 'success', label: 'Done' }
  ]
  
  return (
    <div className={styles.progressSteps}>
      {steps.map((step, i) => (
        <div 
          key={step.id}
          className={step.id === currentStep ? 'active' : 'complete'}
        >
          <div className={styles.stepNumber}>{i + 1}</div>
          <div className={styles.stepLabel}>{step.label}</div>
        </div>
      ))}
    </div>
  )
}
```

**Time Estimate:** 2-3 hours

---

#### Task 5: Token Validation Warnings
**Why:** Catch issues before import

```tsx
// In TokenTable.tsx
function validateTokens(tokens) {
  const warnings = []
  
  // Check for broken references
  tokens.forEach(token => {
    if (token.value.includes('{')) {
      const ref = token.value.match(/\{(.+?)\}/)[1]
      const exists = tokens.some(t => t.path === ref)
      if (!exists) {
        warnings.push({
          token: token.name,
          type: 'broken-reference',
          message: `Reference ${ref} not found`
        })
      }
    }
  })
  
  // Check for circular references
  // Check for duplicate names
  // Check for accessibility (color contrast)
  
  return warnings
}
```

**Time Estimate:** 4-6 hours

---

### Phase 2.3: Advanced Features (P2 - Nice to Have)

#### Task 6: Format Selector
**Why:** Support multiple export formats

Options:
- Simple JSON (current) ✅
- Style Dictionary format
- Tailwind config
- SCSS variables

**Time Estimate:** 8-10 hours per format

---

#### Task 7: Batch Value Transforms
**Why:** Efficiently modify many tokens at once

Operations:
- Multiply spacing values (× 1.5)
- Add prefix/suffix to names
- Convert color format
- Update collection assignment

**Time Estimate:** 6-8 hours

---

## 📋 Recommended Execution Order

### Sprint 1 (Week 1) - Export Completion
**Goal:** Make export match import quality

**Days 1-2:** Task 1 - Dual Export (tokens + styles)
**Days 3-4:** Task 2 - Export Preview UI  
**Day 5:** Testing & bug fixes

**Deliverable:** Export produces tokens.json + styles.json with preview

---

### Sprint 2 (Week 2) - CSS Integration
**Goal:** Show generated CSS in plugin

**Days 1-3:** Task 3 - CSS Preview Integration
**Days 4-5:** Task 4 - Progress Steps + Polish

**Deliverable:** Complete export workflow with CSS preview

---

### Sprint 3 (Week 3) - Validation & Polish
**Goal:** Production-ready quality

**Days 1-2:** Task 5 - Token Validation
**Days 3-5:** Bug fixes, documentation, testing

**Deliverable:** v1.0-ready plugin

---

## 🎯 Success Criteria for v1.0

### Must Have (P0)
- [x] Import: JSON → Figma Variables
- [x] Preview: Token table with editing
- [ ] Export: Figma → tokens.json + styles.json
- [ ] Preview: Show JSON before download
- [x] Generate: CSS with opacity (CLI)
- [ ] Test: Round-trip integrity (import → export → import)

### Should Have (P1)
- [ ] CSS Preview: Show generated CSS in plugin
- [ ] Validation: Warn about broken references
- [ ] Progress: Visual step indicator
- [ ] Copy: Clipboard support for all outputs

### Nice to Have (P2)
- [ ] Formats: Style Dictionary, Tailwind, SCSS
- [ ] Transforms: Batch value operations
- [ ] Diff: Show what changed (override mode)
- [ ] History: Track previous exports

---

## 🛠️ Technical Decisions

### 1. Browser-Compatible CSS Generation
**Challenge:** `generate-tokens.ts` uses Node.js APIs (fs, path)

**Solution:** Create browser version that works with in-memory data
```typescript
// utils/css-generator-browser.ts
export function generateCSS(tokensData, stylesData) {
  // Same logic as generate-tokens.ts
  // But work with JavaScript objects, not files
  // Return CSS strings, not write to disk
}
```

---

### 2. Dual Download Pattern
**Challenge:** Download 2 files from plugin UI

**Solution:** Use JSZip or sequential downloads
```typescript
function downloadMultipleFiles(files: Array<{name: string, content: string}>) {
  // Option 1: Sequential downloads
  files.forEach(file => {
    downloadJSON(file.content, file.name)
  })
  
  // Option 2: ZIP archive (requires JSZip)
  const zip = new JSZip()
  files.forEach(file => zip.file(file.name, file.content))
  zip.generateAsync({type:"blob"})
    .then(blob => downloadBlob(blob, 'cipher-export.zip'))
}
```

**Decision:** Start with sequential, add ZIP later if needed

---

### 3. Code Reuse Strategy
**Challenge:** Don't duplicate CSS generation logic

**Solution:** Extract shared functions
```
tokens/
├── utils/
│   ├── css-generator.ts          # Core logic (pure functions)
│   ├── css-generator-node.ts     # Node.js wrapper (fs operations)
│   └── css-generator-browser.ts  # Browser wrapper (in-memory)
scripts/
└── generate-tokens.ts             # CLI entry point
```

---

## 📊 Testing Plan

### Unit Tests
- [ ] Token parsing accuracy
- [ ] CSS generation output
- [ ] Reference resolution
- [ ] Opacity detection

### Integration Tests
- [ ] Import → Edit → Export → Import (round-trip)
- [ ] All token types (color, spacing, string, etc.)
- [ ] Multiple modes (Light/Dark)
- [ ] Nested structures

### E2E Tests
- [ ] Full import workflow
- [ ] Full export workflow
- [ ] Batch operations
- [ ] Error handling

---

## 📚 Documentation Tasks

- [ ] Update README with export instructions
- [ ] Document export format specifications
- [ ] Create video tutorial (import + export + CSS)
- [ ] Write migration guide (other plugins → Cipher)
- [ ] API documentation for developers

---

## 🚦 Quick Start (This Week)

### Monday-Tuesday: Task 1
```bash
# Implement dual export
git checkout -b feature/dual-export
# Edit handlers/export-handler.ts
# Test export generates both files
git commit -m "Add styles.json export alongside tokens.json"
```

### Wednesday-Thursday: Task 2
```bash
# Add export preview
git checkout -b feature/export-preview
# Create ExportPreview component
# Add to ExportPage flow
git commit -m "Add JSON preview before download"
```

### Friday: Testing
```bash
# Round-trip test
1. Export tokens from Figma
2. Import exported tokens
3. Export again
4. Compare: should be identical
```

---

## 💡 Quick Wins (Can Do Today)

### 1. Update Plugin Title
```typescript
// ui.tsx - line 50
<h1>Cipher</h1>  // Currently says "TokenBridge"
```

### 2. Add Keyboard Shortcuts
```typescript
// TokenTable.tsx
useEffect(() => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleImport() // Cmd+Enter to import
    }
  }
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [])
```

### 3. Improve Empty State
```tsx
// ExportPage.tsx
{collections.length === 0 && (
  <EmptyState
    icon={<Database />}
    title="No Variables Found"
    description="Create some variables in Figma first, then export them here."
    action={<Button onClick={...}>Learn How</Button>}
  />
)}
```

---

## ❓ Questions to Answer

### Before Starting
1. **Download Pattern:** Sequential files or ZIP archive?
   - Recommendation: Sequential (simpler, works everywhere)

2. **CSS Format:** Which format is priority 1?
   - Recommendation: CSS Variables (current), add others later

3. **Preview Style:** Monaco editor or simple pre tag?
   - Recommendation: Simple `<pre>` with syntax colors (faster)

4. **Validation Level:** Warn or block on errors?
   - Recommendation: Warn (don't block, user decides)

---

## 🎉 Expected Outcome

After completing Sprint 1-2 (2 weeks):

**User can:**
1. Import tokens from JSON ✅ (already works)
2. Preview and edit before import ✅ (already works)
3. **Export tokens to JSON** ✅ (enhanced)
4. **Preview JSON before download** (new!)
5. **See generated CSS immediately** (new!)
6. **Download everything at once** (new!)
7. Generate CSS via CLI ✅ (already works)

**Result:** Complete bidirectional workflow! 🔄

---

**Status:** Ready to execute  
**Next Action:** Choose Task 1 or Task 2 to start  
**Estimated Time to v1.0:** 2-3 weeks

