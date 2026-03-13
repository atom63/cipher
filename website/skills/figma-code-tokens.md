# Figma ↔ Code Token Implementation

Skill for creating Figma components that use design token variables and styles, matching the codebase's Tailwind/shadcn CSS token system.

## Core Workflow

1. **Read code** — extract variants, sizes, colors, spacing from the component's `cva()` or style definitions
2. **Fetch Figma variables** — use `figma_get_variables` with `resolveAliases: true` to get semantic token values
3. **Map CSS tokens → Figma variables** — e.g. `bg-primary` → `shadcn/primary`, `rounded-sm` → `rounded/sm`
4. **Create components** — build all variant×size combinations with auto-layout
5. **Bind variables** — apply Figma variable bindings to fills, text, strokes, radii
6. **Arrange** — use `figma_arrange_component_set` for grid layout
7. **Re-bind** — arrange step recreates the component set and **wipes all bindings**, so re-apply after

## Token Mapping Reference

### Colors (semantics collection, Light/Dark modes)

| CSS Token | Figma Variable | Variable ID |
|---|---|---|
| `bg-primary` | `shadcn/primary` | `9:327` |
| `text-primary-foreground` | `shadcn/primary-foreground` | `9:328` |
| `bg-secondary` | `shadcn/secondary` | `9:329` |
| `text-secondary-foreground` | `shadcn/secondary-foreground` | `9:330` |
| `bg-background` | `shadcn/background` | `9:321` |
| `text-foreground` | `shadcn/foreground` | `9:322` |
| `bg-card` | `shadcn/card` | `9:323` |
| `bg-destructive` | `shadcn/destructive` | `9:335` |
| `bg-success` | `shadcn/success` | `9:336` |
| `bg-warning` | `shadcn/warning` | `9:337` |
| `bg-info` | `shadcn/info` | `9:338` |
| `border-input` | `shadcn/input` | `9:340` |
| `border-border` | `shadcn/border` | `9:339` |
| `text-accent-foreground` | `shadcn/accent-foreground` | `9:334` |
| `ring-ring` | `shadcn/ring` | `9:341` |

### Border Radius (abstractions collection)

| CSS Class | Figma Variable | Value | Variable ID |
|---|---|---|---|
| `rounded-[.25rem]` | `rounded/xs` | 4px | `9:257` |
| `rounded-sm` | `rounded/sm` | 6px | `9:258` |
| `rounded-md` | `rounded/md` | 8px | `9:259` |
| `rounded-lg` | `rounded/lg` | 10px | `9:260` |
| `rounded-xl` | `rounded/xl` | 14px | `9:261` |

### Spacing (primitives collection)

| CSS Class | Figma Variable | Value |
|---|---|---|
| `gap-1` / `p-1` | `spacing/1` | 4px |
| `gap-1.5` / `p-1.5` | `spacing/1_5` | 6px |
| `gap-2` / `p-2` | `spacing/2` | 8px |
| `gap-3` / `p-3` | `spacing/3` | 12px |

### Typography (responsive collection, desktop/tablet/mobile modes)

| CSS Class | Figma Variable | Desktop |
|---|---|---|
| `type-body` / `text-sm` | `typography/body/font-size` | 14px |
| `type-subhead` / `text-xs` | `typography/subhead/font-size` | 13px |
| `type-footnote` | `typography/footnote/font-size` | 12px |
| `type-caption-1` | `typography/caption-1/font-size` | 11px |
| `type-caption-2` | `typography/caption-2/font-size` | 10px |

## Critical API Patterns

### Always use async variable fetching

```javascript
// WRONG — silently returns null in dynamic-page mode
const v = figma.variables.getVariableById('VariableID:9:327');

// CORRECT
const v = await figma.variables.getVariableByIdAsync('VariableID:9:327');
```

### Binding variables to solid fills

**CRITICAL**: Always use the RESOLVED color value as the base paint color, not a gray placeholder.
Using `{ r: 0.5, g: 0.5, b: 0.5 }` causes exports via `exportAsync` to show gray instead of the
variable value. Resolve the variable first, then bind:

```javascript
const variable = await figma.variables.getVariableByIdAsync('VariableID:9:327');

// Resolve the actual color value for the default mode
async function resolveColor(v) {
  const modeId = Object.keys(v.valuesByMode)[0];
  let val = v.valuesByMode[modeId];
  while (val && val.type === 'VARIABLE_ALIAS') {
    const av = await figma.variables.getVariableByIdAsync(val.id);
    val = av.valuesByMode[Object.keys(av.valuesByMode)[0]];
  }
  return val;
}

const color = await resolveColor(variable);
let paint = { type: 'SOLID', color: { r: color.r, g: color.g, b: color.b }, opacity: 1 };
paint = figma.variables.setBoundVariableForPaint(paint, 'color', variable);
node.fills = [paint];
```

### Binding variables to border radius

```javascript
const radiusVar = await figma.variables.getVariableByIdAsync('VariableID:9:258');
node.setBoundVariable('topLeftRadius', radiusVar);
node.setBoundVariable('topRightRadius', radiusVar);
node.setBoundVariable('bottomLeftRadius', radiusVar);
node.setBoundVariable('bottomRightRadius', radiusVar);
```

### Binding variables to strokes

```javascript
const borderVar = await figma.variables.getVariableByIdAsync('VariableID:9:339');
let stroke = { type: 'SOLID', color: { r: 0.91, g: 0.91, b: 0.91 } };
stroke = figma.variables.setBoundVariableForPaint(stroke, 'color', borderVar);
node.strokes = [stroke];
node.strokeWeight = 1;
node.strokeAlign = 'INSIDE';
```

### Applying a paint style (e.g. for opacity tokens)

```javascript
const styles = await figma.getLocalPaintStylesAsync();
const style = styles.find(s => s.name === 'shadcn/primary/10');
await node.setFillStyleIdAsync(style.id);
```

## Color + Opacity Pattern (e.g. `bg-primary/10`)

The Figma Plugin API cannot bind variables to gradient stops. To create a token-like style for `color/opacity` (e.g. `bg-primary/10`):

### Create gradient paint style (API approach)

```javascript
// 1. Create gradient with same color on both stops
const style = figma.createPaintStyle();
style.name = 'shadcn/primary/10';

let paint = {
  type: 'GRADIENT_LINEAR',
  gradientTransform: [[1, 0, 0], [0, 1, 0]],
  gradientStops: [
    { position: 0, color: { r: 0, g: 0.565, b: 1, a: 1 } },
    { position: 1, color: { r: 0, g: 0.565, b: 1, a: 1 } },
  ],
};
style.paints = [paint];

// 2. Set layer opacity to 10% via read-clone-write
const paints = style.paints.map(p => ({ ...p }));
paints[0].opacity = 0.1;
style.paints = paints;
```

### Why gradient instead of solid + opacity?

- In Figma UI, solid fills with bound variables lock the opacity control
- Gradient stops can have independent alpha AND variable bindings (UI-only)
- The gradient technique (same-color both stops + layer opacity) is the standard Figma workaround
- After creating via API, manually bind each gradient stop to the variable in Figma UI

### API-only alternative (solid + opacity)

```javascript
// This works through the API but can't be replicated in UI
let paint = { type: 'SOLID', color: { r: 0, g: 0.565, b: 1 }, opacity: 0.1 };
paint = figma.variables.setBoundVariableForPaint(paint, 'color', variable);
style.paints = [paint];
// Read-clone-write to ensure opacity sticks
const p2 = style.paints.map(p => ({ ...p }));
p2[0].opacity = 0.1;
style.paints = p2;
```

## Paint Styles (opacity-based fills)

Created using the gradient technique (same color both stops + layer opacity):

| Style Name | Base Color | Opacity | Used By |
|---|---|---|---|
| `shadcn/primary/10` | primary variable | 10% | Badge primaryMuted, Button primary-muted |
| `shadcn/destructive/8` | destructive variable | 8% | Badge error |
| `shadcn/success/8` | success variable | 8% | Badge success |
| `shadcn/warning/8` | warning variable | 8% | Badge warning |
| `shadcn/info/8` | info variable | 8% | Badge info |
| `tailwind/{color}-500/10` | tailwind color hex | 10% | Badge color variants (17 colors) |

## Tailwind Colors (tailwind-colors collection)

Collection ID: `VariableCollectionId:57:814`, Mode: `57:0`

Key 500-shade variable IDs (used for badge text fills):

| Color | Variable ID | Hex |
|---|---|---|
| red/500 | `57:820` | #fb2c36 |
| orange/500 | `57:831` | #ff6900 |
| amber/500 | `57:842` | #fe9a00 |
| yellow/500 | `57:853` | #f0b100 |
| lime/500 | `57:864` | #7ccf00 |
| green/500 | `57:875` | #00c950 |
| emerald/500 | `57:886` | #00bc7d |
| teal/500 | `57:897` | #00bba7 |
| cyan/500 | `57:908` | #00b8db |
| sky/500 | `57:919` | #00a6f4 |
| blue/500 | `57:930` | #2b7fff |
| indigo/500 | `57:941` | #615fff |
| violet/500 | `57:952` | #8e51ff |
| purple/500 | `57:963` | #ad46ff |
| fuchsia/500 | `57:974` | #e12afb |
| pink/500 | `57:985` | #f6339a |
| rose/500 | `57:996` | #ff2056 |

## Known Limitations

| Limitation | Workaround |
|---|---|
| `setBoundVariableForPaint` only accepts `'color'` field | Only works for solid paints; gradient stop binding is Figma UI only |
| `combineAsVariants()` / `figma_arrange_component_set` wipes variable bindings | Always re-apply bindings AFTER arranging |
| `getVariableById` (sync) silently fails | Always use `getVariableByIdAsync` |
| Placeholder color `{0.5, 0.5, 0.5}` shows in exports | Always resolve variable to actual color before binding |
| No `*-foreground` variables for status colors (destructive, warning, info) | Use base accent color for text, or hardcode appropriate dark variants |
| Inner shadow effects require `blendMode: 'NORMAL'` | Include in all effect objects |
| `set_fillStyleId` is sync-blocked | Use `await node.setFillStyleIdAsync(id)` |
| `primaryAxisSizingMode` uses `'AUTO'` not `'HUG'` | Figma plugin API enum is `FIXED` or `AUTO` |

## Component Creation Checklist

1. Load fonts: `await figma.loadFontAsync({ family: "Inter", style: "Regular" })`
2. Load all needed variables with `getVariableByIdAsync`
3. Create components with auto-layout, proper sizing, and padding
4. Apply fills with `setBoundVariableForPaint` + variable
5. Apply text fills with variable bindings
6. Apply stroke bindings for bordered variants
7. Apply radius bindings with `setBoundVariable`
8. Apply paint styles for opacity-based fills (`setFillStyleIdAsync`)
9. Combine with `combineAsVariants`
10. Add `Label` TEXT component property
11. Link text nodes to Label property via `componentPropertyReferences`
12. Arrange with `figma_arrange_component_set`
13. **Re-apply ALL variable bindings** (step 4-8 again on new component set ID)
14. Verify with `figma_capture_screenshot`
