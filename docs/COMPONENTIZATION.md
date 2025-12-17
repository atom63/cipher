# UI Component Componentization Guide

## Overview
Best practices for creating and maintaining reusable UI components in the Figma plugin.

## Core Principles

### 1. Single Responsibility
Each component should do one thing well:
- `Checkbox` - Base checkbox input
- `CheckboxWithLabel` - Checkbox + inline label
- `CheckboxWithDescription` - Checkbox + label + helper text
- `CheckboxCard` - Checkbox in card layout with icon

### 2. Composition Over Configuration
Build complex components by composing simpler ones:

```tsx
// Good: CheckboxCard uses base Checkbox
<CheckboxCard icon={icon} label={label}>
  <Checkbox id={id} checked={checked} />
</CheckboxCard>

// Bad: CheckboxCard reimplements checkbox logic
```

### 3. Smart Defaults, Flexible Overrides
Components should work great out of the box but allow customization:

```tsx
interface CheckboxCardProps {
  // Required essentials
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  
  // Optional enhancements
  icon?: ReactNode
  description?: string
  disabled?: boolean
  className?: string
}
```

### 4. Accessibility First
All components include:
- ✅ Semantic HTML
- ✅ ARIA attributes
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ Screen reader support

## Component Structure

### File Organization
```
components/ui/ComponentName/
├── ComponentName.tsx           # Main component
├── ComponentName.module.css    # Scoped styles
├── ComponentNameVariant.tsx    # Variants (if needed)
└── index.tsx                   # Exports
```

### CSS Modules Best Practices

#### Use Design Tokens
```css
.component {
  color: var(--foreground);
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--spacing-md);
  gap: var(--spacing-md);
  font-size: var(--text-base);
  transition: all var(--transition);
}
```

#### Use color-mix for Tints
```css
/* Good: Works with OKLCH colors */
.checked {
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  border-color: var(--primary);
}

/* Bad: Hardcoded hex colors */
.checked {
  background: #eff6ff;
}
```

#### Optical Alignment
Add subtle padding for visual balance:
```css
.icon {
  padding-top: 2px; /* Aligns with text baseline */
}
```

## Layout Patterns

### Smart Layout (CheckboxCard Example)
Adapt layout based on content:

```tsx
// With icon: [Icon] [Content →] [Checkbox]
<CheckboxCard icon={<Icon />} label="Label" />

// Without icon: [Checkbox] [Content]
<CheckboxCard label="Label" />
```

```css
.card {
  display: flex;
  align-items: flex-start; /* Not center! */
  gap: var(--spacing-md);
}

.card.withIcon {
  justify-content: space-between;
}
```

### Alignment Guidelines

#### Use flex-start for Multi-line Content
```css
/* Good: Alert, CheckboxCard, etc. */
.component {
  align-items: flex-start;
}

/* Bad: Looks awkward with descriptions */
.component {
  align-items: center;
}
```

#### Visual Hierarchy
```
┌─────────────────────────────────────┐
│ [Icon]  Title                  [✓] │  ← All aligned to baseline
│         Description text            │
└─────────────────────────────────────┘
```

## Visual Refinements

### Border Weights
```css
/* Buttons, Cards */
border: 1px solid var(--border);

/* Checkboxes (refined) */
border: 1.5px solid var(--border);

/* Focus states */
outline: 2px solid var(--primary);
```

### Spacing Scale
```css
--spacing-2xs: 2px   /* Optical alignment */
--spacing-xs: 4px    /* Tight gaps */
--spacing-sm: 8px    /* Small gaps */
--spacing-md: 12px   /* Default gap */
--spacing-lg: 16px   /* Card padding */
--spacing-xl: 24px   /* Section spacing */
```

## Common Patterns

### Card-Style Components
For selectable items with metadata:

```tsx
<ComponentCard
  icon={<Icon />}              // Visual identifier
  label="Primary text"         // Main content
  description="Helper text"    // Secondary info
  action={<Button />}          // Optional action
  checked={boolean}            // State
  onChange={handler}           // Handler
  disabled={boolean}           // Disabled state
/>
```

Examples: `CheckboxCard`, `RadioCard`

### Form Field Components
For user input with labels:

```tsx
<FormField
  id={string}                  // Required for a11y
  label="Field label"          // Clear label
  description="Helper text"    // Optional help
  error="Error message"        // Validation
  required={boolean}           // Required state
/>
```

Examples: `Input`, `Textarea`, `CheckboxWithDescription`

### Feedback Components
For status and notifications:

```tsx
<Feedback
  variant="info|success|warning|error"  // Semantic type
  title="Title"                         // Optional title
  icon={<Icon />}                       // Custom icon
  showIcon={boolean}                    // Toggle icon
/>
```

Examples: `Alert`, `Badge`, `EmptyState`

## Testing in Styleguide

Every component should be showcased in `StyleguidePage.tsx`:

```tsx
<section>
  <SectionHeader
    title="Component Name"
    description="Brief description"
  />
  
  <Card>
    <div className={styles.componentGroup}>
      <h4>Variants</h4>
      <div className={styles.column}>
        <Component variant="default" />
        <Component variant="disabled" />
      </div>
    </div>
  </Card>
</section>
```

## When to Componentize

### ✅ Good Candidates
- Used in 2+ places
- Common UI pattern (cards, lists, forms)
- Complex logic that should be centralized
- Pattern that will grow (more variants expected)

### ❌ Don't Over-Componentize
- One-off custom layouts
- Page-specific compositions
- Trivial wrappers around native elements

## Component Evolution

### Start Simple
```tsx
// V1: Basic functionality
export function Checkbox({ id, checked, onChange }) {
  return <input type="checkbox" />
}
```

### Add Variants
```tsx
// V2: With label variant
export function CheckboxWithLabel({ id, label, checked, onChange }) {
  return (
    <div>
      <Checkbox id={id} checked={checked} onChange={onChange} />
      <label htmlFor={id}>{label}</label>
    </div>
  )
}
```

### Create Specialized Versions
```tsx
// V3: Card layout variant
export function CheckboxCard({ icon, label, description, checked, onChange }) {
  return (
    <label className={styles.card}>
      {icon && <Icon />}
      <Content label={label} description={description} />
      <Checkbox checked={checked} onChange={onChange} />
    </label>
  )
}
```

## Export Strategy

Use barrel exports for clean imports:

```tsx
// components/ui/Checkbox/index.tsx
export { Checkbox } from './Checkbox'
export { CheckboxWithLabel } from './CheckboxWithLabel'
export { CheckboxWithDescription } from './CheckboxWithDescription'
export { CheckboxCard } from './CheckboxCard'

// components/ui/index.tsx
export * from './Checkbox'
export * from './Button'
export * from './Input'
// ...

// Usage in other files
import { CheckboxCard, Button } from '@/components/ui'
```

## Recent Improvements

### CheckboxCard Refinements
1. **Custom Check Icon** - Using lucide-react for consistency
2. **Smart Layout** - Checkbox position adapts to icon presence
3. **Top Alignment** - Matches Alert pattern for multi-line content
4. **Optical Alignment** - 2px padding for text baseline
5. **Refined Border** - 1.5px for elegant appearance

These refinements demonstrate the iterative improvement process for components.

## Resources

- **Styleguide**: `/styleguide` route in plugin UI
- **Component Library**: `figma/plugin/components/ui/`
- **Design Tokens**: `figma/plugin/ui.scss`

## Questions to Ask

Before creating a component:
1. Does this pattern appear 2+ times?
2. Will it have multiple variants?
3. Does it encapsulate complex logic?
4. Is it a common UI pattern?
5. Will it benefit from centralized updates?

If 3+ answers are "yes", componentize it!

