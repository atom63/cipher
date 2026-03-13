# UI Components

Reusable UI components with scoped styling support.

## Structure

Each component lives in its own folder with:
- `ComponentName.tsx` - Component logic
- `ComponentName.module.scss` - Scoped styles (optional)
- `index.tsx` - Re-export for clean imports

```
ui/
├── Button/
│   ├── Button.tsx
│   ├── Button.module.scss
│   └── index.tsx
├── Input/
│   ├── Input.tsx
│   └── index.tsx
├── Checkbox/
│   ├── Checkbox.tsx
│   └── index.tsx
├── RadioGroup/
│   ├── RadioGroup.tsx
│   └── index.tsx
├── SectionHeader/
│   ├── SectionHeader.tsx
│   └── index.tsx
└── index.tsx  ← Central export
```

## Usage

### Import from central index:
```tsx
import { Button, Input, Checkbox } from '../components/ui';
```

### Import individual component:
```tsx
import { Button } from '../components/ui/Button';
```

Both work! Use whichever you prefer.

## Benefits

✅ **Organized** - Each component has its own folder  
✅ **Co-located** - Styles live next to component  
✅ **Clean imports** - No messy relative paths  
✅ **Scalable** - Easy to add tests, stories, etc.  
✅ **Tree-shakeable** - Only imports what you use

## Adding a New Component

1. Create a folder: `components/ui/NewComponent/`
2. Add `NewComponent.tsx`
3. Add `index.tsx` that exports it
4. (Optional) Add `NewComponent.module.scss` for scoped styles
5. Export from `components/ui/index.tsx`

Example:
```tsx
// components/ui/Badge/Badge.tsx
export function Badge({ children }) {
  return <span className="badge">{children}</span>;
}

// components/ui/Badge/index.tsx
export { Badge } from './Badge';

// components/ui/index.tsx
export { Badge } from './Badge';
```

Done! Now import it:
```tsx
import { Badge } from '../components/ui';
```

