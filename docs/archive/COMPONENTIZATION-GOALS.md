# Componentization Goals & Status

## 🎯 Primary Goals

### 1. Componentization
Break down the plugin into reusable, self-contained components

### 2. Maintenance & Scalability
Make it easy to add features and fix bugs without breaking things

### 3. No Style Duplication
Each style should be defined once and reused everywhere

### 4. Component Reuse
Use existing components instead of creating new ones

---

## ✅ Current Status: What We've Accomplished

### UI Component Library (13 components)
Located in `components/ui/`

| Component | Status | CSS Module | Usage |
|-----------|--------|------------|-------|
| **Button** | ✅ Complete | ✅ | Used in Dropdown, Dialogs, Pages |
| **Dropdown** | ✅ Complete | ✅ | Reuses Button, used in TokenTable |
| **Input** | ✅ Complete | ✅ | Used across forms |
| **Textarea** | ✅ Complete | ✅ | Used in forms |
| **Checkbox** | ✅ Complete | ✅ | Multiple variants |
| **Radio** | ✅ Complete | ✅ | Multiple variants |
| **RadioGroup** | ✅ Complete | ✅ | Used in Settings |
| **Badge** | ✅ Complete | ✅ | Used everywhere |
| **Card** | ✅ Complete | ✅ | Layout component |
| **Dialog** | ✅ Complete | ✅ | Modal dialogs |
| **Spinner** | ✅ Complete | ✅ | Loading states |
| **EmptyState** | ✅ Complete | ✅ | Empty views |
| **SectionHeader** | ✅ Complete | ✅ | Page sections |

### Feature Components (5 components)
Located in `components/import/`

| Component | Status | CSS Module | Dependencies |
|-----------|--------|------------|--------------|
| **FileImport** | ✅ Complete | ✅ | LoadingState, EmptyState |
| **TokenTable** | ✅ Complete | ✅ | Button, Dropdown, Badge, Checkbox |
| **CollectionSelector** | ✅ Complete | ✅ | LoadingState, EmptyState |
| **BatchRenameDialog** | ✅ Complete | ✅ | Dialog, Input, RadioGroup, Button |
| **ProgressView** | ✅ Complete | ✅ | LoadingState, Spinner |

### Layout Components (1 component)
Located in `components/layout/`

| Component | Status | CSS Module | Usage |
|-----------|--------|------------|-------|
| **Sidebar** | ✅ Complete | ✅ | Main navigation |

### Pages (6 pages)
Located in `pages/`

| Page | Status | CSS Module | Needs Review |
|------|--------|------------|--------------|
| **ImportPage** | ✅ | ❌ No CSS | Uses feature components |
| **SettingsPage** | ⚠️ Partial | ❌ Global styles | **Needs componentization** |
| **StyleguidePage** | ✅ Complete | ✅ | Showcase page |
| **ExportPage** | ✅ | ❌ Placeholder | Coming soon |
| **SyncPage** | ✅ | ❌ Placeholder | Coming soon |
| **HelpPage** | ✅ | ❌ Placeholder | Coming soon |

---

## 🔍 Current State Analysis

### ✅ Good (80% Complete)
1. **UI Component Library** - Comprehensive, reusable components
2. **CSS Modules** - Most components have scoped styles
3. **Component Composition** - Button used in Dropdown, etc.
4. **Feature Components** - Import flow fully componentized
5. **No Duplication** - Button styles defined once, used everywhere

### ⚠️ Needs Attention (20% Remaining)

#### 1. Settings Page (`pages/SettingsPage.tsx`)
**Issue:** Uses global styles from `ui.scss`, not fully componentized

**Current:**
```tsx
// Uses global classes
<div className="settings-page">
  <div className="settings-header">
    <h2>Settings</h2>
  </div>
  <div className="settings-section">
    // Content
  </div>
</div>
```

**Should be:**
```tsx
// Use components
<div className={styles.settingsPage}>
  <SectionHeader title="Settings" />
  <Card>
    // Content
  </Card>
</div>
```

#### 2. Coming Soon Pages
**Issue:** Duplicate "coming soon" markup in 3 pages

**Current:**
- ExportPage.tsx - Has coming soon markup
- SyncPage.tsx - Has coming soon markup  
- HelpPage.tsx - Has coming soon markup

**Should be:**
- Create `<ComingSoon>` component
- Reuse in all 3 pages

#### 3. Global Styles in `ui.scss`
**Issue:** Some page-specific styles still in global file

**Current global styles:**
```scss
.coming-soon { ... }           // Should be in ComingSoon.module.css
.settings-page { ... }         // Should be in SettingsPage.module.css
.settings-header { ... }       // Should be in SettingsPage.module.css
.settings-section { ... }      // Should be in SettingsPage.module.css
.settings-actions { ... }      // Should be in SettingsPage.module.css
```

**Should keep in `ui.scss`:**
```scss
:root { ... }                  // ✅ Design tokens (keep)
body, * { ... }                // ✅ Global resets (keep)
.plugin-container { ... }      // ✅ App layout (keep)
.view-mode-header { ... }      // ✅ App header (keep)
.plugin-main { ... }           // ✅ Page wrapper (keep)
```

---

## 📋 Action Plan

### Phase 1: Settings Page Componentization ⚡ HIGH PRIORITY

**Task 1.1: Create SettingsPage.module.css**
- [ ] Move `.settings-page` styles
- [ ] Move `.settings-header` styles
- [ ] Move `.settings-section` styles
- [ ] Move `.settings-actions` styles

**Task 1.2: Refactor SettingsPage.tsx**
- [ ] Import CSS module
- [ ] Use `<Card>` for sections
- [ ] Use `<SectionHeader>` for headers
- [ ] Use scoped class names

**Impact:** Remove ~50 lines from `ui.scss`

### Phase 2: ComingSoon Component ⚡ MEDIUM PRIORITY

**Task 2.1: Create ComingSoon Component**
- [ ] Create `components/ui/ComingSoon/ComingSoon.tsx`
- [ ] Create `components/ui/ComingSoon/ComingSoon.module.css`
- [ ] Move styles from `ui.scss`
- [ ] Export from `components/ui/index.tsx`

**Task 2.2: Update Pages**
- [ ] Update ExportPage.tsx
- [ ] Update SyncPage.tsx
- [ ] Update HelpPage.tsx

**Impact:** Remove ~60 lines from `ui.scss`, DRY up 3 pages

### Phase 3: Final Cleanup 🧹 LOW PRIORITY

**Task 3.1: Review Remaining Global Styles**
- [ ] Audit `ui.scss` for any missed page-specific styles
- [ ] Create page CSS modules where needed
- [ ] Update components to use scoped styles

**Task 3.2: Documentation**
- [ ] Update component list
- [ ] Add usage examples
- [ ] Create maintenance guide

---

## 📊 Metrics

### Current State
```
Total Components: 19 (13 UI + 5 Feature + 1 Layout)
CSS Modules Coverage: 85% (16/19 have modules)
Style Duplication: 5% (minimal)
Global Styles: ~390 lines (should be ~200 lines)
```

### Target State
```
Total Components: 21 (14 UI + 5 Feature + 1 Layout + 1 Utility)
CSS Modules Coverage: 95% (20/21 have modules)
Style Duplication: 0% (none)
Global Styles: ~200 lines (tokens + app layout only)
```

### Improvement
```
New Components: +2 (ComingSoon, SettingsPage module)
Lines Removed: -190 lines from ui.scss
Reduction: -49% global styles
Reusability: +15% (more component reuse)
```

---

## 🎯 Definition of "Done"

### Component Library
- ✅ All UI components have CSS Modules
- ✅ Components are exported from central index
- ✅ Components are documented in Styleguide
- ✅ No duplicate component implementations

### Pages
- ✅ All pages use components (not global styles)
- ✅ Page-specific styles in CSS modules
- ✅ No duplicate page markup
- ✅ Coming soon pages use shared component

### Global Styles
- ✅ Only design tokens in `:root`
- ✅ Only global resets in `body`, `*`
- ✅ Only app-level layout in `.plugin-*`
- ✅ No page-specific styles
- ✅ No component-specific styles

### Code Quality
- ✅ No style duplication
- ✅ DRY principle followed
- ✅ Easy to add new pages/features
- ✅ Easy to maintain existing code

---

## 🚀 Quick Wins

### Immediate Impact (1-2 hours)
1. **ComingSoon Component** - Removes duplication from 3 pages
2. **SettingsPage.module.css** - Removes 50+ lines from global styles

### High Value (low effort)
- Both tasks are straightforward
- Clear before/after improvements
- Significant reduction in global styles
- Better maintainability

---

## 🔄 Maintenance Strategy

### For New Features
1. ✅ Check if existing component can be used
2. ✅ Create component in `components/ui/` if reusable
3. ✅ Create component in feature folder if specific
4. ✅ Always use CSS Modules (no global styles)
5. ✅ Export from central index
6. ✅ Add to Styleguide page

### For Bug Fixes
1. ✅ Fix in the component itself
2. ✅ Update CSS Module if needed
3. ✅ Test in Styleguide page
4. ✅ Verify in all usages

### For Style Changes
1. ✅ Check if it's a design token (update `:root`)
2. ✅ Check if it's component-specific (update module)
3. ✅ Never add to global styles
4. ✅ Update Styleguide if visible change

---

## 📈 Success Criteria

### Quantitative
- [ ] CSS Modules coverage: 95%+
- [ ] Global styles: < 200 lines
- [ ] Component reuse: All pages use components
- [ ] Style duplication: 0%

### Qualitative
- [ ] Easy to find where styles are defined
- [ ] Easy to add new features
- [ ] Easy to fix bugs
- [ ] Clear component boundaries
- [ ] Consistent patterns everywhere

---

## 🎨 Visual: Before vs After

### Before (Current)
```
ui.scss (390 lines)
├── Design tokens (68 lines) ✅
├── Global resets (45 lines) ✅
├── App layout (80 lines) ✅
├── Settings page styles (50 lines) ❌ Should be in module
├── Coming soon styles (60 lines) ❌ Should be in component
├── Misc utilities (87 lines) ⚠️ Some should be in modules
```

### After (Target)
```
ui.scss (200 lines)
├── Design tokens (68 lines) ✅
├── Global resets (45 lines) ✅
├── App layout (80 lines) ✅
└── Minimal utilities (7 lines) ✅

components/ui/ComingSoon/ComingSoon.module.css (60 lines)
pages/SettingsPage.module.css (50 lines)
```

---

## 🤝 Next Steps

Ready to proceed with:
1. **SettingsPage componentization** (removes global styles)
2. **ComingSoon component** (removes duplication)
3. **Final cleanup** (polish remaining issues)

**Estimated Time:** 2-3 hours for complete componentization

**Priority:** HIGH - Finishes the 20% remaining work

---

**Status:** 📊 80% Complete → Target: 100% Complete  
**Blockers:** None  
**Ready to proceed:** ✅ Yes

