# Component Styling Guide

**Author:** You Zhang (ATOM63)

## CSS Modules Setup

We now support **CSS Modules** for component-scoped styles!

### How It Works

1. Create a `.module.scss` file next to your component
2. Import it in your component
3. Use the styles object to apply scoped classes
4. All class names are automatically hashed for uniqueness

### Example: Button Component

**File structure:**
```
components/ui/
├── Button.tsx
└── Button.module.scss  ← Scoped styles
```

**Button.module.scss:**
```scss
.button {
  padding: var(--spacing-sm);
  background: var(--primary);
  
  &:hover {
    background: var(--primary-dark);
  }
}

.primary {
  background: var(--primary);
}

.secondary {
  background: var(--background);
}
```

**Button.tsx:**
```tsx
import styles from './Button.module.scss';

export function Button({ variant = 'primary' }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      Click me
    </button>
  );
}
```

**Generated HTML:**
```html
<button class="button_abc123 primary_abc123">
  Click me
</button>
```

All classes are automatically scoped with a unique hash!

---

## Two Styling Approaches

### Approach 1: CSS Modules (Component-Scoped)
**Best for:** Reusable UI components that need isolated styles

**Pros:**
- ✅ Automatic scoping - no class name conflicts
- ✅ Co-located with components
- ✅ Type-safe with TypeScript
- ✅ Tree-shakeable

**Cons:**
- ❌ More files to manage
- ❌ Can't use SCSS variables across files (use CSS variables instead)

**Use for:**
- UI components (`Button`, `Input`, `Checkbox`)
- Reusable components
- Components that might be used in multiple contexts

---

### Approach 2: Global SCSS (Current System)
**Best for:** Layout, themes, and shared styles

**Pros:**
- ✅ One source of truth (`ui.scss`)
- ✅ Easy to share variables and mixins
- ✅ Good for layout and global styles

**Cons:**
- ❌ All classes are global
- ❌ Risk of naming conflicts

**Use for:**
- Global CSS variables (colors, spacing, etc.)
- Layout styles (`.plugin-container`, `.plugin-main`)
- Shared utilities
- Page-level styles

---

## Recommended Structure

```
figma/plugins/design-system/
├── ui.scss                          ← Global styles, variables, layout
├── components/
│   ├── ui/                         ← Reusable UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.module.scss  ← Scoped
│   │   ├── Input/
│   │   │   ├── Input.tsx
│   │   │   └── Input.module.scss   ← Scoped
│   │   └── Checkbox/
│   │       ├── Checkbox.tsx
│   │       └── Checkbox.module.scss ← Scoped
│   └── CollectionSelector/
│       ├── CollectionSelector.tsx
│       └── CollectionSelector.module.scss ← Scoped
└── pages/
    └── ImportPage/
        ├── ImportPage.tsx
        └── ImportPage.module.scss   ← Scoped
```

---

## Best Practices

### 1. Use CSS Variables for Theming
```scss
// ✅ Good - uses global CSS variables
.button {
  background: var(--primary);
  padding: var(--spacing-md);
  border-radius: var(--radius);
}

// ❌ Bad - hardcoded values
.button {
  background: #18a0fb;
  padding: 12px;
}
```

### 2. Keep Class Names Simple
```scss
// ✅ Good - will become .container_abc123
.container {
  display: flex;
}

// ❌ Bad - too specific, defeats scoping purpose
.collectionSelectorContainer {
  display: flex;
}
```

### 3. Use Composition
```tsx
// ✅ Good - compose classes
<div className={`${styles.card} ${styles.active}`}>

// ❌ Bad - creating new classes for combinations
// .cardActive { ... }
```

### 4. Nest for States
```scss
.button {
  background: var(--primary);
  
  &:hover {
    background: var(--primary-dark);
  }
  
  &:disabled {
    opacity: 0.5;
  }
  
  &.loading {
    pointer-events: none;
  }
}
```

---

## Migration Strategy

You don't need to migrate everything at once!

**Phase 1:** Keep global `ui.scss` for now
**Phase 2:** Create `.module.scss` for new components
**Phase 3:** Gradually migrate existing components

**Priority for migration:**
1. ✅ Reusable UI components (Button, Input, Checkbox)
2. ✅ Complex feature components (CollectionSelector, TokenTable)
3. ⏸️ Pages (can stay global)
4. ⏸️ Layout (should stay global)

---

## TypeScript Support

Create a declaration file for better TypeScript support:

**css-modules.d.ts:**
```typescript
declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}
```

This gives you autocomplete and type checking for CSS modules!

---

## Questions?

- **Q:** Can I mix global and scoped styles?
  **A:** Yes! Import both: `import styles from './Button.module.scss'` and global classes work too.

- **Q:** What about animations and keyframes?
  **A:** Put them in global `ui.scss` or use CSS-in-JS for component-specific animations.

- **Q:** Do I need to update build.js?
  **A:** No, it's already configured! Just create `.module.scss` files.

