# Design System Architecture

**Author:** You Zhang (ATOM63)

## Token Architecture Layers

The ATOM63 Design System uses a **4-layer token architecture** for maximum flexibility and maintainability:

### 1. **Primitives** (Foundation Layer)
Raw values that form the foundation of your design system. These are context-independent and never change based on mode.

**Examples:**
- Colors: `primitives/color/blue/500`
- Spacing: `primitives/spacing/4`
- Typography: `primitives/font/size/16`
- Radius: `primitives/radius/8`

### 2. **Abstractions** (Semantic Mapping Layer)
Semantic names mapped to primitive values. These provide meaning without context.

**Examples:**
- `abstractions/surface/500` → `{primitives.color.zinc.500}`
- `abstractions/primary/solid` → `{primitives.color.emerald.500}`
- `abstractions/rounded/base` → `{primitives.radius.12}`

### 3. **Semantics** (Context Layer)
Context-aware tokens that adapt to modes (Light/Dark). These reference abstractions or primitives.

**Modes:** Light, Dark

**Examples:**
- `semantics/background/primary/rest` (Light: zinc-200, Dark: zinc-800)
- `semantics/foreground/primary/rest` (Light: zinc-950, Dark: zinc-50)
- `semantics/stroke/focus/rest` → references primary color

### 4. **Responsive** (NEW - Responsive Layer)
Viewport-aware tokens that adapt to screen sizes. Primarily used for typography scales and spacing.

**Modes:** mobile (min), tablet (sm), desktop (md)

**Examples:**
- `responsive/typography/large-title/font-size` (mobile: 34px, tablet: 48px, desktop: 64px)
- `responsive/typography/title-1/line-height` (mobile: 37.4px, tablet: 50.4px, desktop: 64px)
- `responsive/viewport/screen` (mobile: iPhone 16 Pro, tablet: iPad Pro 11", desktop: MacBook Air)

## CSS Organization Best Practices

### ✅ DO: Use CSS Modules for Components

**CSS Modules** provide scoped, reusable styles that prevent conflicts and duplicates.

```tsx
// ✅ GOOD: Component with CSS Module
// Checkbox.tsx
import styles from './Checkbox.module.css'

export function Checkbox({ id, checked, onChange }) {
  return (
    <input
      type="checkbox"
      className={styles.checkbox}
      checked={checked}
      onChange={onChange}
    />
  )
}
```

```css
/* Checkbox.module.css */
.checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--primary);
}
```

### ❌ DON'T: Use Raw HTML with Global Classes

```tsx
// ❌ BAD: Raw HTML with global classes
function MyComponent() {
  return (
    <label className="checkbox-label">
      <input type="checkbox" />
      Label text
    </label>
  )
}
```

This creates duplicates - you need styles in both component modules AND global ui.scss.

### 📁 File Structure

```
components/
├── ui/
│   ├── Checkbox/
│   │   ├── Checkbox.tsx              # Primitive component
│   │   ├── Checkbox.module.css       # Scoped styles
│   │   ├── CheckboxWithLabel.tsx     # Composition
│   │   └── index.tsx                 # Exports
│   ├── Radio/
│   ├── Input/
│   └── index.tsx                     # Centralized exports
├── TokenTable.tsx                    # Uses UI components
└── BatchRenameDialog.tsx             # Uses UI components
```

## The 3-Layer Architecture

### 1. **Design Tokens** (ui.scss - CSS Variables)
Global design tokens that all components use:

```scss
:root {
  --primary: #0754ab;
  --spacing-md: 12px;
  --radius: 6px;
  --transition: 0.2s;
}
```

### 2. **Component Styles** (*.module.css)
Scoped styles for reusable components:

```css
.checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--primary); /* Uses token */
}
```

### 3. **Layout Styles** (ui.scss - Global Classes)
Page layouts, dialog structures, and utility classes:

```scss
.dialog-layout {
  display: flex;
  gap: var(--spacing-xl);
}

.table-controls {
  display: flex;
  justify-content: space-between;
}
```

## Component Composition Pattern

Build complex components from primitives:

```tsx
// Primitive
export function Checkbox({ id, checked, onChange }) { ... }

// Composition
export function CheckboxWithLabel({ id, label, checked, onChange }) {
  return (
    <div className={styles.wrapper}>
      <Checkbox id={id} checked={checked} onChange={onChange} />
      <label htmlFor={id}>{label}</label>
    </div>
  )
}

// Advanced Composition
export function CheckboxWithDescription({ id, label, description, checked, onChange }) {
  return (
    <div className={styles.settingItem}>
      <CheckboxWithLabel {...props} />
      <span className={styles.description}>{description}</span>
    </div>
  )
}
```

### Radio Component Hierarchy

Radio components follow a 3-tier architecture:

```
Radio (primitive)
  ↓
RadioCard (styled card with icon/badge support)
  ↓
RadioGroup (container that manages multiple RadioCards)
```

**When to use each:**

| Component | Use Case | Example |
|-----------|----------|---------|
| `Radio` | Raw radio input (rare) | Custom layouts |
| `RadioCard` | Single styled radio card (rare) | One-off custom cards |
| `RadioGroup` | Group of radio options (common) | Most use cases |

**RadioGroup is the preferred API:**

```tsx
// ✅ PREFERRED: Declarative, handles everything
<RadioGroup
  label="Import Mode"
  description="Choose how to import"
  name="mode"
  value={mode}
  onChange={setMode}
  options={[
    { 
      value: 'new', 
      label: 'Create New',
      description: 'Start fresh',
      icon: <FolderPlus size={16} />
    },
    { 
      value: 'existing', 
      label: 'Append to Existing',
      badge: 'Recommended'
    },
  ]}
/>

// ❌ AVOID: Manual mapping (only when you need custom layout)
{collections.map(c => (
  <RadioCard 
    icon={<FolderOpen />}
    title={c.name}
    ...
  />
))}
```

## Usage Pattern

Always import and use components from the centralized export:

```tsx
// ✅ GOOD
import { CheckboxWithLabel, Input, RadioGroup } from './ui'

function MyForm() {
  return (
    <>
      <Input label="Name" value={name} onChange={setName} />
      <CheckboxWithLabel id="agree" label="I agree" checked={agreed} onChange={setAgreed} />
      <RadioGroup name="theme" options={themes} value={theme} onChange={setTheme} />
    </>
  )
}
```

```tsx
// ❌ BAD
function MyForm() {
  return (
    <div className="form-group">
      <label>Name</label>
      <input type="text" className="form-input" />
    </div>
  )
}
```

## Benefits

✅ **No Duplicates** - Each style is defined once in its component module  
✅ **Scoped Styles** - CSS Modules prevent naming conflicts  
✅ **Type Safety** - TypeScript ensures correct component usage  
✅ **Composability** - Build complex components from simple ones  
✅ **Maintainability** - Component and styles are co-located  
✅ **Performance** - Only used styles are bundled

## Build Process

The `build.js` file handles CSS Modules automatically:

1. `.module.css` files → Scoped class names with hash
2. `ui.scss` → Compiled and minified
3. Both inlined into `dist/ui.html` for Figma

## Migration Checklist

When you find raw HTML with global classes:

- [ ] Check if a component exists in `components/ui/`
- [ ] If yes, import and use it
- [ ] If no, create a new component with CSS module
- [ ] Remove the global class from `ui.scss`
- [ ] Test to ensure styling works

## Summary

**Rule of Thumb:**  
- **Components** → CSS Modules (`.module.css`)
- **Tokens & Layout** → Global SCSS (`ui.scss`)
- **Pages** → Use components, not raw HTML

