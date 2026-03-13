# Compare Component

A flexible image comparison component built with `react-compare-slider` that allows users to compare two images with an interactive slider.

## Features

- ✅ Horizontal and vertical slider modes
- ✅ Customizable starting position
- ✅ Custom handle support
- ✅ Aspect ratio control
- ✅ Object-fit options
- ✅ Position change callbacks
- ✅ Fully accessible
- ✅ TypeScript support

## Installation

The `react-compare-slider` package is already installed in this project.

## Basic Usage

```tsx
import { Compare } from '@/components/custom/compare'

export function MyComponent() {
  return (
    <Compare
      beforeImage="/images/before.jpg"
      afterImage="/images/after.jpg"
      beforeAlt="Before image description"
      afterAlt="After image description"
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `beforeImage` | `string` | **required** | URL of the first (left/top) image |
| `afterImage` | `string` | **required** | URL of the second (right/bottom) image |
| `beforeAlt` | `string` | `"Before"` | Alt text for the before image |
| `afterAlt` | `string` | `"After"` | Alt text for the after image |
| `position` | `number` | `50` | Initial slider position (0-100) |
| `vertical` | `boolean` | `false` | Enable vertical slider mode |
| `aspectRatio` | `string` | `undefined` | Aspect ratio (e.g., "16/9", "4/3") |
| `objectFit` | `string` | `"cover"` | CSS object-fit value |
| `handle` | `ReactNode` | Default handle | Custom handle component |
| `onPositionChange` | `(position: number) => void` | `undefined` | Callback when slider moves |
| `resetOnLeave` | `boolean` | `false` | Reset to center on mouse leave |
| `resetDelay` | `number` | `500` | Delay (ms) before reset |
| `transition` | `string` | `"0.25s cubic-bezier..."` | CSS transition for slider |
| `changePositionOnHover` | `boolean` | `false` | Move slider on hover |
| `className` | `string` | `undefined` | Additional CSS classes |

## Examples

### With Aspect Ratio

```tsx
<Compare
  beforeImage="/images/before.jpg"
  afterImage="/images/after.jpg"
  aspectRatio="16/9"
/>
```

### Vertical Slider

```tsx
<Compare
  beforeImage="/images/before.jpg"
  afterImage="/images/after.jpg"
  vertical
/>
```

### Custom Starting Position

```tsx
<Compare
  beforeImage="/images/before.jpg"
  afterImage="/images/after.jpg"
  position={75}
/>
```

### With Position Tracking

```tsx
function MyComponent() {
  const [position, setPosition] = useState(50)

  return (
    <div>
      <p>Slider position: {position.toFixed(0)}%</p>
      <Compare
        beforeImage="/images/before.jpg"
        afterImage="/images/after.jpg"
        position={position}
        onPositionChange={setPosition}
      />
    </div>
  )
}
```

### Object Fit Options

```tsx
// Cover (default) - image covers entire area
<Compare
  beforeImage="/images/before.jpg"
  afterImage="/images/after.jpg"
  objectFit="cover"
/>

// Contain - image fits within area
<Compare
  beforeImage="/images/before.jpg"
  afterImage="/images/after.jpg"
  objectFit="contain"
/>
```

### Custom Styling

```tsx
<Compare
  beforeImage="/images/before.jpg"
  afterImage="/images/after.jpg"
  className="shadow-xl border-2 border-primary"
/>
```

### Reset on Mouse Leave

```tsx
<Compare
  beforeImage="/images/before.jpg"
  afterImage="/images/after.jpg"
  resetOnLeave
  resetDelay={500}
/>
```

### Change Position on Hover

```tsx
<Compare
  beforeImage="/images/before.jpg"
  afterImage="/images/after.jpg"
  changePositionOnHover
/>
```

## Use Cases

1. **Before/After Designs** - Show design iterations or improvements
2. **Theme Comparisons** - Compare light vs dark themes
3. **Image Processing** - Show original vs edited images
4. **Feature Toggles** - Demonstrate feature differences
5. **A/B Testing** - Visual comparison of variations

## Accessibility

The component uses the `ReactCompareSliderImage` component which includes proper alt text for screen readers. Always provide meaningful `beforeAlt` and `afterAlt` props.

## Performance

- Images are lazy-loaded by default
- The component is fully memoized
- Optimized for smooth interactions

## Browser Support

Works in all modern browsers that support CSS Grid and Flexbox.
