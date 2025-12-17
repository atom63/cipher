# Responsive Design Tokens

**ATOM63 TokenBridge - Responsive Layer Documentation**

## Overview

The **Responsive layer** is the 4th layer in the ATOM63 token architecture, designed specifically for responsive design in Figma. It allows you to define tokens that change values based on viewport size, making it easy to implement responsive typography scales and layouts.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Responsive Layer (viewport-aware, multi-mode)          │
│  - responsive/typography/large-title/font-size          │
│  - responsive/typography/title-1/line-height            │
│  - responsive/viewport/screen                           │
└────────────────┬────────────────────────────────────────┘
                 │ references
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Abstractions Layer (semantic mapping)                  │
│  - abstractions/type/large-title/size/min              │
│  - abstractions/type/large-title/size/sm               │
│  - abstractions/type/large-title/size/md               │
└────────────────┬────────────────────────────────────────┘
                 │ references
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Primitives Layer (foundation)                          │
│  - primitives/font/size/34                             │
│  - primitives/font/size/48                             │
│  - primitives/font/size/64                             │
└─────────────────────────────────────────────────────────┘
```

## Modes

The responsive collection uses **3 modes** to represent different viewport sizes:

| Mode | Description | Typical Use |
|------|-------------|-------------|
| `mobile (min)` | Minimum mobile viewport | iPhone, small screens |
| `tablet (sm)` | Small tablet/large mobile | iPad Mini, large phones |
| `desktop (md)` | Medium desktop | Laptops, desktop monitors |

## Token Structure

### JSON Format

```json
{
  "$collections": {
    "responsive": {
      "name": "responsive",
      "modes": [
        "mobile (min)",
        "tablet (sm)",
        "desktop (md)"
      ]
    }
  },
  "tokens": {
    "responsive": {
      "typography": {
        "large-title": {
          "font-size": {
            "type": "number",
            "collection": "responsive",
            "modes": {
              "mobile (min)": "{abstractions.type.large-title.size.min}",
              "tablet (sm)": "{abstractions.type.large-title.size.sm}",
              "desktop (md)": "{abstractions.type.large-title.size.md}"
            }
          },
          "line-height": {
            "type": "number",
            "collection": "responsive",
            "modes": {
              "mobile (min)": "37.400001525878906px",
              "tablet (sm)": "50.400001525878906px",
              "desktop (md)": "64px"
            }
          }
        }
      }
    }
  }
}
```

## Use Cases

### 1. Responsive Typography

Define typography scales that adapt to viewport size:

```json
{
  "responsive": {
    "typography": {
      "title-1": {
        "font-size": {
          "type": "number",
          "modes": {
            "mobile (min)": "28px",
            "tablet (sm)": "34px",
            "desktop (md)": "64px"
          }
        }
      }
    }
  }
}
```

### 2. Responsive Spacing

Define spacing that scales with viewport:

```json
{
  "responsive": {
    "spacing": {
      "page-padding": {
        "type": "spacing",
        "modes": {
          "mobile (min)": "16px",
          "tablet (sm)": "24px",
          "desktop (md)": "32px"
        }
      }
    }
  }
}
```

### 3. Viewport References

Store viewport-specific values:

```json
{
  "responsive": {
    "viewport": {
      "screen": {
        "type": "number",
        "modes": {
          "mobile (min)": "{primitives.screen.iPhone 16 Pro}",
          "tablet (sm)": "{primitives.screen.iPad Pro 11\"}",
          "desktop (md)": "{primitives.screen.MacBook Air}"
        }
      }
    }
  }
}
```

## Implementation in Figma

### Creating Responsive Variables

1. **Create Collection**
   ```typescript
   const collection = figma.variables.createVariableCollection('responsive')
   ```

2. **Add Modes**
   ```typescript
   collection.renameMode(defaultMode, 'mobile (min)')
   collection.addMode('tablet (sm)')
   collection.addMode('desktop (md)')
   ```

3. **Create Variables with Mode-Specific Values**
   ```typescript
   const variable = figma.variables.createVariable('typography/large-title/font-size', collection, 'FLOAT')
   
   variable.setValueForMode(mobileMode, 34)   // mobile (min)
   variable.setValueForMode(tabletMode, 48)   // tablet (sm)
   variable.setValueForMode(desktopMode, 64)  // desktop (md)
   ```

### Using Responsive Variables

In Figma, you can:
1. **Apply to Text Layers**: Bind font size to responsive variables
2. **Switch Modes**: Use the mode switcher to preview different viewports
3. **Prototype**: Test responsive behavior in Figma prototypes

## Best Practices

### ✅ DO

- **Use References**: Reference abstractions layer tokens when possible
  ```json
  "font-size": {
    "modes": {
      "mobile (min)": "{abstractions.type.large-title.size.min}",
      "tablet (sm)": "{abstractions.type.large-title.size.sm}",
      "desktop (md)": "{abstractions.type.large-title.size.md}"
    }
  }
  ```

- **Follow Naming Conventions**: Use clear, semantic names
  - `typography/large-title/font-size`
  - `typography/body/line-height`
  - `spacing/page-padding`

- **Group Related Tokens**: Keep typography properties together
  ```json
  "typography": {
    "large-title": {
      "font-size": { ... },
      "line-height": { ... }
    }
  }
  ```

### ❌ DON'T

- **Avoid Hardcoded Values**: Use references instead
  ```json
  // ❌ Bad
  "font-size": {
    "modes": {
      "mobile (min)": "34px",
      "tablet (sm)": "48px",
      "desktop (md)": "64px"
    }
  }
  
  // ✅ Good
  "font-size": {
    "modes": {
      "mobile (min)": "{primitives.font.size.34}",
      "tablet (sm)": "{primitives.font.size.48}",
      "desktop (md)": "{primitives.font.size.64}"
    }
  }
  ```

- **Avoid Inconsistent Mode Names**: Use the standard 3 modes
- **Don't Mix Concerns**: Keep responsive tokens separate from semantic tokens

## Import/Export Support

### Importing Responsive Tokens

The TokenBridge plugin fully supports importing responsive collections:

```bash
# The import handler will:
1. Detect the "responsive" collection
2. Create 3 modes: mobile (min), tablet (sm), desktop (md)
3. Set values for each mode
4. Resolve references to other collections
```

### Exporting Responsive Tokens

When exporting, the plugin will:

```bash
1. Export the responsive collection with all 3 modes
2. Preserve mode-specific values
3. Include reference bindings
4. Maintain nested structure
```

## Example: Complete Responsive Typography System

```json
{
  "$collections": {
    "primitives": {
      "modes": ["Mode 1"]
    },
    "abstractions": {
      "modes": ["Mode 1"]
    },
    "responsive": {
      "modes": ["mobile (min)", "tablet (sm)", "desktop (md)"]
    }
  },
  "tokens": {
    "primitives": {
      "font": {
        "size": {
          "34": { "value": "34px", "type": "sizing" },
          "48": { "value": "48px", "type": "sizing" },
          "64": { "value": "64px", "type": "sizing" }
        }
      }
    },
    "abstractions": {
      "type": {
        "large-title": {
          "size": {
            "min": { "value": "{primitives.font.size.34}", "type": "sizing" },
            "sm": { "value": "{primitives.font.size.48}", "type": "sizing" },
            "md": { "value": "{primitives.font.size.64}", "type": "sizing" }
          }
        }
      }
    },
    "responsive": {
      "typography": {
        "large-title": {
          "font-size": {
            "type": "number",
            "modes": {
              "mobile (min)": "{abstractions.type.large-title.size.min}",
              "tablet (sm)": "{abstractions.type.large-title.size.sm}",
              "desktop (md)": "{abstractions.type.large-title.size.md}"
            }
          }
        }
      }
    }
  }
}
```

## Troubleshooting

### Issue: Modes Not Created

**Problem**: Responsive collection only has 1 mode

**Solution**: Ensure your JSON includes mode-specific values:
```json
"modes": {
  "mobile (min)": "...",
  "tablet (sm)": "...",
  "desktop (md)": "..."
}
```

### Issue: References Not Resolved

**Problem**: Reference tokens show as plain strings

**Solution**: 
1. Import collections in order: primitives → abstractions → responsive
2. Ensure referenced tokens exist
3. Check reference syntax: `{collection.path.to.token}`

### Issue: Mode Names Don't Match

**Problem**: Export uses different mode names than import

**Solution**: Use consistent mode names across all operations:
- `mobile (min)`
- `tablet (sm)`
- `desktop (md)`

## Technical Details

### Mode Detection

The import handler detects modes by scanning all tokens in a collection:

```typescript
const modeNames = new Set<string>()
for (const token of collectionTokens) {
  if (token.modeName) {
    modeNames.add(token.modeName)
  }
}
```

### Mode Creation

Modes are created in order:
1. First mode renames the default mode
2. Additional modes are added sequentially
3. Mode IDs are mapped to names for reference resolution

### Processing Order

Collections are processed in dependency order:

```typescript
const collectionOrder = ['primitives', 'abstractions', 'semantics', 'responsive']
```

This ensures references are resolved correctly.

## Changelog

### v1.1.0 - Responsive Layer Support
- ✅ Added responsive collection support
- ✅ Multi-mode handling for 3 viewport sizes
- ✅ Reference resolution across responsive tokens
- ✅ Enhanced logging for mode detection and creation
- ✅ Updated documentation and architecture guides

---

**Need Help?** Check the [main README](../README.md) or [architecture guide](../ARCHITECTURE.md) for more information.

