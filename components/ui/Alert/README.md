# Alert Component

A flexible alert component for displaying important messages with different severity levels.

## Features

- **4 Variants**: `info`, `success`, `warning`, `error`
- **Optional Title**: Add a bold title above the message
- **Icons**: Auto icons for each variant or custom icons
- **Accessible**: Proper ARIA role="alert"
- **Design System**: Uses CSS variables from global design tokens

## Usage

### Basic Alert

```tsx
import { Alert } from '../components/ui'

<Alert variant="info">
  This is an informational message.
</Alert>
```

### With Title

```tsx
<Alert variant="success" title="Success!">
  Your changes have been saved successfully.
</Alert>
```

### Without Icon

```tsx
<Alert variant="warning" showIcon={false}>
  Please review your changes before continuing.
</Alert>
```

### Custom Icon

```tsx
import { Star } from 'lucide-react'

<Alert variant="info" icon={<Star size={16} />}>
  This alert uses a custom icon.
</Alert>
```

## Variants

### Info (Default)
Informational messages, tips, or helpful guidance.

```tsx
<Alert variant="info" title="Tip">
  Exported tokens will be in the same format used for imports.
</Alert>
```

### Success
Confirmation of successful operations.

```tsx
<Alert variant="success" title="Complete!">
  Your design tokens have been exported successfully.
</Alert>
```

### Warning
Caution messages that require attention but aren't critical.

```tsx
<Alert variant="warning" title="Warning">
  Some tokens were skipped during import.
</Alert>
```

### Error
Critical errors that need immediate attention.

```tsx
<Alert variant="error" title="Error">
  Failed to export tokens. Please try again.
</Alert>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | Required | The alert message content |
| `variant` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | The alert style variant |
| `title` | `string` | `undefined` | Optional bold title |
| `icon` | `ReactNode` | Auto | Custom icon (overrides default) |
| `showIcon` | `boolean` | `true` | Show/hide icon |
| `className` | `string` | `''` | Additional CSS classes |

## Design Tokens

The Alert component uses these CSS variables:
- `--info`, `--info-foreground`
- `--success`, `--success-foreground`
- `--warning`, `--warning-foreground`
- `--destructive`, `--destructive-foreground`
- `--spacing-*`, `--radius-md`, `--text-sm`, etc.

## Examples in Use

### ExportPage.tsx
```tsx
<Alert variant="info" title="Tip">
  Exported tokens will be in the same format used for imports, 
  making it easy to version control your design system or share with your team.
</Alert>
```

### ImportPage.tsx (potential use)
```tsx
<Alert variant="warning" title="Collection Exists">
  A collection with this name already exists. Choose "Override" to update it.
</Alert>
```

