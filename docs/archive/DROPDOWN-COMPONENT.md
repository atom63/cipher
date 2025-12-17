# Dropdown Component

A flexible, accessible dropdown menu component with custom trigger and menu items.

## Features

✅ **Custom Trigger** - Use any ReactNode or render function as trigger  
✅ **Keyboard Navigation** - Escape to close, focus management  
✅ **Click Outside** - Auto-close when clicking outside  
✅ **Alignment Options** - Left, right, or center alignment  
✅ **Width Control** - Auto, match trigger, or custom width  
✅ **Icons Support** - Add icons to menu items  
✅ **Danger State** - Highlight destructive actions  
✅ **Disabled States** - Disable trigger or individual items  
✅ **Smooth Animations** - Slide-down entrance animation  
✅ **Accessibility** - ARIA attributes and keyboard support  

## Basic Usage

```tsx
import { Dropdown } from '../ui'

<Dropdown
  trigger="Actions"
  options={[
    { value: 'edit', label: 'Edit' },
    { value: 'duplicate', label: 'Duplicate' },
    { value: 'delete', label: 'Delete', danger: true },
  ]}
  onSelect={(value) => console.log(value)}
/>
```

## Custom Trigger Button

```tsx
<Dropdown
  trigger={(isOpen) => (
    <span>
      More Options
      <svg className={isOpen ? 'rotate-180' : ''}>
        {/* chevron icon */}
      </svg>
    </span>
  )}
  options={options}
/>
```

## With Icons

```tsx
<Dropdown
  trigger="Settings"
  options={[
    { 
      value: 'profile', 
      label: 'Profile', 
      icon: <UserIcon /> 
    },
    { 
      value: 'settings', 
      label: 'Settings', 
      icon: <SettingsIcon /> 
    },
    { 
      value: 'logout', 
      label: 'Sign out', 
      icon: <LogoutIcon />,
      danger: true 
    },
  ]}
/>
```

## Alignment Options

```tsx
// Left aligned (default)
<Dropdown align="left" trigger="Left" options={options} />

// Right aligned
<Dropdown align="right" trigger="Right" options={options} />

// Center aligned
<Dropdown align="center" trigger="Center" options={options} />
```

## Width Control

```tsx
// Auto width (default)
<Dropdown width="auto" trigger="Auto" options={options} />

// Match trigger width
<Dropdown width="trigger" trigger="Match Width" options={options} />

// Custom width (pixels)
<Dropdown width={300} trigger="300px Wide" options={options} />
```

## Disabled States

```tsx
// Disabled dropdown
<Dropdown disabled trigger="Disabled" options={options} />

// Disabled individual items
<Dropdown
  trigger="Actions"
  options={[
    { value: 'edit', label: 'Edit' },
    { value: 'delete', label: 'Delete', disabled: true },
  ]}
/>
```

## Custom onClick Handlers

```tsx
<Dropdown
  trigger="Actions"
  options={[
    { 
      value: 'download', 
      label: 'Download',
      onClick: () => {
        // Custom handler
        console.log('Downloading...')
      }
    },
  ]}
  onSelect={(value) => {
    // Global handler (called after onClick)
    console.log('Selected:', value)
  }}
/>
```

## Props

### DropdownProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `trigger` | `ReactNode \| ((isOpen: boolean) => ReactNode)` | - | Trigger button content or render function |
| `options` | `DropdownOption[]` | - | Array of menu options |
| `align` | `'left' \| 'right' \| 'center'` | `'left'` | Menu alignment relative to trigger |
| `width` | `'auto' \| 'trigger' \| number` | `'auto'` | Menu width control |
| `disabled` | `boolean` | `false` | Disable the entire dropdown |
| `onSelect` | `(value: string) => void` | - | Callback when an option is selected |
| `className` | `string` | `''` | Additional CSS class for container |

### DropdownOption

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Unique identifier for the option |
| `label` | `string` | - | Display text for the option |
| `icon` | `ReactNode` | - | Optional icon to display before label |
| `disabled` | `boolean` | `false` | Disable this specific option |
| `danger` | `boolean` | `false` | Style as destructive action (red) |
| `onClick` | `() => void` | - | Custom click handler for this option |

## Styling

The component uses CSS Modules for scoped styling. Key classes:

- `.dropdown` - Container
- `.trigger` - Trigger button
- `.menu` - Dropdown menu
- `.menuItem` - Individual menu items
- `.menuItemDanger` - Destructive action styling

## Accessibility

- ✅ Proper ARIA attributes (`aria-haspopup`, `aria-expanded`, `role="menu"`)
- ✅ Keyboard support (Escape to close)
- ✅ Focus management (returns focus to trigger on close)
- ✅ Disabled state support

## Examples in the Codebase

Replace native `<select>` with custom dropdown menus where you need:
- Action menus (Edit, Delete, etc.)
- Navigation menus
- Settings/options menus
- Context menus

## Comparison: Select vs Dropdown

| Use Case | Component | Reason |
|----------|-----------|--------|
| Form input with predefined values | `Select` | Native form control, better for data entry |
| Action menu with icons | `Dropdown` | Custom styling, icons, better UX |
| Navigation menu | `Dropdown` | Custom trigger, better control |
| Context menu | `Dropdown` | Flexible positioning and styling |

