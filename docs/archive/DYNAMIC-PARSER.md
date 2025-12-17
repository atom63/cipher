# Dynamic Token Parser

## Overview

The Figma plugin now features a **completely dynamic token parser** that can import **ANY token type** without requiring pre-specification or code changes.

## Problem Solved

### Before (Limited & Hardcoded)
```typescript
// ❌ Required explicit handling for each token type
if (data.colors) { /* parse colors */ }
if (data.spacing) { /* parse spacing */ }
if (data.radius) { /* parse radius */ }
// Adding new types required code changes!
```

### After (Dynamic & Extensible)
```typescript
// ✅ Automatically handles ANY token type
parseTokenObject(data) // Recursively discovers all tokens
```

## How It Works

### 1. **Type Detection**
The parser identifies tokens by their structure, not by hardcoded categories:

```json
{
  "my-custom-tokens": {
    "button-height": { 
      "value": "44", 
      "type": "sizing" 
    },
    "animation-duration": { 
      "value": "300", 
      "type": "duration" 
    }
  }
}
```

Both tokens will be imported automatically!

### 2. **Recursive Parsing**
The parser traverses **any nested structure**:

```json
{
  "design": {
    "mobile": {
      "ios": {
        "colors": {
          "primary": { "value": "#007AFF", "type": "color" }
        }
      }
    }
  }
}
```

Creates variable: `design/mobile/ios/colors/primary`

### 3. **Value Type Inference**
Even without explicit types, the parser infers intelligently:

```json
{
  "colors": {
    "primary": "#3B82F6"  // ← Inferred as color
  },
  "spacing": {
    "md": 16  // ← Inferred as spacing
  }
}
```

### 4. **Supported Token Types**

#### **Colors**
- `type: "color"`
- Formats: hex (`#3B82F6`), OKLCH (`oklch(0.7 0.2 260)`)
- → Figma: `COLOR` variable

#### **Numeric Types** → `FLOAT` variables
- `type: "spacing"` - margins, padding
- `type: "sizing"` - widths, heights
- `type: "borderRadius"` - corner radius
- `type: "borderWidth"` - stroke width
- `type: "number"` - generic numbers
- `type: "dimension"` - any dimension

#### **String Types** → `STRING` variables
- `type: "string"` - generic text
- `type: "fontFamily"` - font families
- `type: "fontWeight"` - font weights
- `type: "text"` - text content

#### **New Type? No Problem!**
```json
{
  "animations": {
    "fast": { "value": "150", "type": "duration" }
  }
}
```
The parser will:
1. Detect it's a numeric value
2. Create a `FLOAT` variable
3. Store the type as `"duration"`

## Architecture

### Parser Flow
```
JSON Input
    ↓
parseTokenObject() ← Recursive traversal
    ↓
Detect token (has 'value' + 'type')
    ↓
parseTokenValue() ← Type-based parsing
    ↓
Create DesignToken
    ↓
createVariablesFromTokens() ← Figma API
    ↓
Figma Variables ✨
```

### Type Mapping

| Token Type | Figma Variable Type | Example |
|-----------|---------------------|---------|
| `color` | `COLOR` | `oklch(0.7 0.2 260)` |
| `spacing`, `sizing`, `borderRadius`, `borderWidth` | `FLOAT` | `16` |
| `fontFamily`, `fontWeight`, `string` | `STRING` | `"Inter"` |

### Files Modified

1. **`parsers/json-parser.ts`** - Dynamic parsing logic
2. **`code.ts`** - Plugin backend with same logic
3. **`types/tokens.ts`** - Extensible type definitions

```typescript
// Extensible types allow any string while keeping autocomplete
export type TokenType =
  | 'color'
  | 'spacing'
  | 'sizing'
  | 'borderRadius'
  // ... common types
  | (string & {}) // ✨ Accepts any string!
```

## Usage Examples

### Example 1: Full Design System
```json
{
  "$collections": {
    "primitives": { "name": "Primitives" }
  },
  "tokens": {
    "primitives": {
      "colors": {
        "blue": { "value": "oklch(0.5 0.2 260)", "type": "color" }
      },
      "spacing": {
        "md": { "value": "16", "type": "spacing" }
      },
      "radius": {
        "lg": { "value": "12", "type": "borderRadius" }
      },
      "sizes": {
        "button": { "value": "44", "type": "sizing" }
      }
    }
  }
}
```

All tokens imported automatically! ✅

### Example 2: Custom Token Types
```json
{
  "tokens": {
    "animations": {
      "fast": { "value": "150", "type": "duration" },
      "smooth": { "value": "ease-in-out", "type": "timing-function" }
    },
    "breakpoints": {
      "mobile": { "value": "768", "type": "breakpoint" }
    }
  }
}
```

Even custom types work! ✅

### Example 3: Legacy Format (Auto-inferred)
```json
{
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#10B981"
  },
  "spacing": {
    "sm": 8,
    "md": 16
  }
}
```

Types inferred from category names! ✅

## Benefits

### ✅ **No Code Changes Needed**
Add `borderWidth`, `duration`, `elevation` - the parser handles them all.

### ✅ **Future-Proof**
New token types in the Design Tokens spec? Automatically supported.

### ✅ **Flexible Structure**
Any nesting level, any naming convention - works out of the box.

### ✅ **Type Safety**
TypeScript types are extensible while maintaining autocomplete.

### ✅ **Backwards Compatible**
Legacy formats with simple key-value pairs still work.

## Migration Guide

### If You Have Custom Token Types

**Before:** Would need to fork and modify the parser

**After:** Just use the `type` field!

```json
{
  "my-custom-category": {
    "my-token": {
      "value": "42",
      "type": "my-custom-type"
    }
  }
}
```

The parser will:
- Detect it as a number → create `FLOAT` variable
- Store the original type (`"my-custom-type"`)
- Create variable: `my-custom-category/my-token`

## Technical Details

### Value Parsing Algorithm

```typescript
function parseTokenValue(value, type) {
  // 1. Check explicit type
  if (type === 'color') return parseColor(value)
  if (isNumericType(type)) return parseNumber(value)
  if (isStringType(type)) return String(value)
  
  // 2. Fallback: infer from value format
  if (looksLikeColor(value)) return parseColor(value)
  if (looksLikeNumber(value)) return parseNumber(value)
  
  // 3. Default: return as string
  return String(value)
}
```

### Category Detection

```typescript
function parseTokenObject(obj, path = []) {
  for (const [key, value] of Object.entries(obj)) {
    if (hasValueAndType(value)) {
      // This is a token!
      const category = path[0] || 'tokens'
      createToken(value, path.join('/'), category)
    } else {
      // This is a group, recurse deeper
      parseTokenObject(value, [...path, key])
    }
  }
}
```

## Testing

```bash
# Build the plugin
pnpm figma:build

# Test with sample files
figma/plugins/design-system/sample-tokens.json         # ✅ Full system
figma/plugins/design-system/sample-tokens-simple.json  # ✅ Simple format
```

## Future Enhancements

Potential additions (already supported by architecture):

- [ ] Duration tokens → numeric
- [ ] Elevation/Z-index → numeric
- [ ] Breakpoint tokens → numeric
- [ ] Gradient tokens → special handling
- [ ] Typography composite tokens → nested structure
- [ ] Motion/timing functions → string

## Summary

🎯 **Before:** Limited to hardcoded token types  
🚀 **After:** Unlimited flexibility - import ANY token type

The parser is now **truly generic** and **future-proof**! 🎉

