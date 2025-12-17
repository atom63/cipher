# Responsive Type Scale Reference

**ATOM63 Design System - Complete Typography System**

## Overview

This document provides a complete reference for the responsive type scale system implemented in the ATOM63 Design System. All type scales adapt across three viewport sizes with carefully calculated line-heights.

## Type Scale Table

| Type Scale Role | Property | min (Mobile) | sm (Tablet) | md (Desktop) |
|----------------|----------|--------------|-------------|--------------|
| **Large Title** | Font Size (px) | 34 | 48 | 64 |
|                 | Line Height Ratio | 1.1 (110%) | 1.05 (105%) | 1.0 (100%) |
|                 | Line Height (px) | 37.4 | 50.4 | 64 |
| **Title 1** | Font Size (px) | 28 | 34 | 40 |
|             | Line Height Ratio | 1.2 (120%) | 1.1 (110%) | 1.05 (105%) |
|             | Line Height (px) | 33.6 | 37.4 | 42 |
| **Title 2** | Font Size (px) | 22 | 28 | 32 |
|             | Line Height Ratio | 1.3 (130%) | 1.2 (120%) | 1.1 (110%) |
|             | Line Height (px) | 28.6 | 33.6 | 35.2 |
| **Title 3** | Font Size (px) | 20 | 22 | 24 |
|             | Line Height Ratio | 1.4 (140%) | 1.3 (130%) | 1.2 (120%) |
|             | Line Height (px) | 28 | 28.6 | 28.8 |
| **Headline** | Font Size (px) | 17 | 18 | 20 |
|              | Line Height Ratio | 1.4 (140%) | 1.4 (140%) | 1.3 (130%) |
|              | Line Height (px) | 23.8 | 25.2 | 26 |
| **Body** | Font Size (px) | 16 | 17 | 18 |
|          | Line Height Ratio | 1.5 (150%) | 1.5 (150%) | 1.4 (140%) |
|          | Line Height (px) | 24 | 25.5 | 25.2 |
| **Callout** | Font Size (px) | 15 | 16 | 17 |
|             | Line Height Ratio | 1.5 (150%) | 1.5 (150%) | 1.4 (140%) |
|             | Line Height (px) | 22.5 | 24 | 23.8 |
| **Subhead** | Font Size (px) | 15 | 16 | 16 |
|             | Line Height Ratio | 1.5 (150%) | 1.6 (160%) | 1.5 (150%) |
|             | Line Height (px) | 22.5 | 25.6 | 24 |
| **Footnote** | Font Size (px) | 13 | 14 | 14 |
|              | Line Height Ratio | 1.6 (160%) | 1.7 (170%) | 1.6 (160%) |
|              | Line Height (px) | 20.8 | 23.8 | 22.4 |
| **Caption 1** | Font Size (px) | 12 | 13 | 13 |
|               | Line Height Ratio | 1.6 (160%) | 1.7 (170%) | 1.7 (170%) |
|               | Line Height (px) | 19.2 | 22.1 | 22.1 |
| **Caption 2** | Font Size (px) | 11 | 12 | 12 |
|               | Line Height Ratio | 1.7 (170%) | 1.7 (170%) | 1.7 (170%) |
|               | Line Height (px) | 18.7 | 20.4 | 20.4 |

## Token Structure

### Layer 1: Primitives

Foundation-level font sizes (no modes):

```json
{
  "primitives": {
    "font": {
      "size": {
        "11": { "value": "11px", "type": "sizing" },
        "12": { "value": "12px", "type": "sizing" },
        "13": { "value": "13px", "type": "sizing" },
        "14": { "value": "14px", "type": "sizing" },
        "15": { "value": "15px", "type": "sizing" },
        "16": { "value": "16px", "type": "sizing" },
        "17": { "value": "17px", "type": "sizing" },
        "18": { "value": "18px", "type": "sizing" },
        "20": { "value": "20px", "type": "sizing" },
        "22": { "value": "22px", "type": "sizing" },
        "24": { "value": "24px", "type": "sizing" },
        "28": { "value": "28px", "type": "sizing" },
        "32": { "value": "32px", "type": "sizing" },
        "34": { "value": "34px", "type": "sizing" },
        "40": { "value": "40px", "type": "sizing" },
        "48": { "value": "48px", "type": "sizing" },
        "64": { "value": "64px", "type": "sizing" }
      }
    }
  }
}
```

### Layer 2: Abstractions

Semantic type scales with calculated line-heights:

```json
{
  "abstractions": {
    "type": {
      "large-title": {
        "size": {
          "min": { "value": "{primitives.font.size.34}", "type": "sizing" },
          "sm": { "value": "{primitives.font.size.48}", "type": "sizing" },
          "md": { "value": "{primitives.font.size.64}", "type": "sizing" }
        },
        "line-height": {
          "min": { 
            "value": "37.4px", 
            "type": "number",
            "description": "110% - 1.1 ratio (34 * 1.1 = 37.4)"
          },
          "sm": { 
            "value": "50.4px", 
            "type": "number",
            "description": "105% - 1.05 ratio (48 * 1.05 = 50.4)"
          },
          "md": { 
            "value": "64px", 
            "type": "number",
            "description": "100% - 1.0 ratio (64 * 1.0 = 64)"
          }
        }
      }
      // ... (all other type scales follow same pattern)
    }
  }
}
```

### Layer 3: Responsive

Multi-mode tokens for responsive design:

```json
{
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
            "mobile (min)": "{abstractions.type.large-title.line-height.min}",
            "tablet (sm)": "{abstractions.type.large-title.line-height.sm}",
            "desktop (md)": "{abstractions.type.large-title.line-height.md}"
          }
        }
      }
      // ... (all type scales)
    }
  }
}
```

## Usage in Figma

### 1. Import Tokens

Import your tokens file into Figma using the TokenBridge plugin:

1. Open plugin
2. Go to Import tab
3. Select Variables
4. Upload `tokens-new.json`
5. Select collections: primitives → abstractions → responsive
6. Click Import

### 2. Create Text Styles

After importing, create text styles that use the responsive variables:

**Example: Large Title Style**

```
Style Name: Typography/Large Title
Font Size: → Bound to responsive/typography/large-title/font-size
Line Height: → Bound to responsive/typography/large-title/line-height
Font Family: → Bound to abstractions/font-family/primary
```

### 3. Switch Modes

Use Figma's mode switcher to preview typography at different viewport sizes:

- **mobile (min)**: 34px / 37.4px (1.1 ratio)
- **tablet (sm)**: 48px / 50.4px (1.05 ratio)
- **desktop (md)**: 64px / 64px (1.0 ratio)

## Line-Height Calculation Method

Line-heights are calculated as **font-size × ratio**:

```
Formula: line-height = font-size * ratio

Example (Large Title - Mobile):
  Font Size: 34px
  Ratio: 1.1 (110%)
  Line Height: 34 * 1.1 = 37.4px
```

### Why Pixel Values?

Figma requires **absolute pixel values** for line-heights in variables. The ratio is preserved in the description field for reference.

**Benefits:**
- ✅ Works correctly in Figma variables
- ✅ Ratio documented in description
- ✅ Precise control over typography
- ✅ Easy to bind to text styles

## Design Patterns

### Progressive Line-Height Tightening

Notice how line-height ratios **decrease** as font sizes **increase**:

| Type Scale | Mobile Ratio | Desktop Ratio | Pattern |
|------------|--------------|---------------|---------|
| Large Title | 1.1 (110%) | 1.0 (100%) | Tighter at desktop |
| Title 1 | 1.2 (120%) | 1.05 (105%) | Progressive tightening |
| Body | 1.5 (150%) | 1.4 (140%) | More breathing room |
| Caption 2 | 1.7 (170%) | 1.7 (170%) | Maximum spacing |

**Rationale:** Larger text needs less relative spacing, smaller text needs more breathing room for readability.

### Consistent Body Text

Body text maintains similar physical line-height across modes:

- Mobile: 16px × 1.5 = **24px**
- Tablet: 17px × 1.5 = **25.5px**
- Desktop: 18px × 1.4 = **25.2px**

This ensures consistent readability across all viewport sizes.

## iOS vs Web Mapping

The responsive type scale aligns with iOS Human Interface Guidelines:

| Responsive | iOS Equivalent | Notes |
|------------|----------------|-------|
| Large Title | Large Title | Hero text |
| Title 1 | Title 1 | Page titles |
| Title 2 | Title 2 | Section titles |
| Title 3 | Title 3 | Subsection titles |
| Headline | Headline | Emphasized content |
| Body | Body | Standard text |
| Callout | Callout | Featured content |
| Subhead | Subheadline | Secondary info |
| Footnote | Footnote | Metadata |
| Caption 1 | Caption 1 | Image captions |
| Caption 2 | Caption 2 | Smallest text |

## Best Practices

### ✅ DO

1. **Bind Text Styles to Responsive Variables**
   - Creates automatic responsive typography
   - Centralized control
   - Easy to update globally

2. **Use Figma Modes for Preview**
   - Test typography at all viewport sizes
   - Ensure readability across breakpoints
   - Validate design consistency

3. **Reference Line-Height Ratios**
   - Check description fields for ratios
   - Understand the spacing system
   - Make informed adjustments

4. **Follow Type Hierarchy**
   - Use appropriate scale for content importance
   - Maintain visual hierarchy
   - Ensure accessibility

### ❌ DON'T

1. **Don't Hardcode Font Sizes**
   - Always use variables/styles
   - Maintain system consistency

2. **Don't Override Line-Heights Manually**
   - Trust the calculated ratios
   - Preserve system integrity

3. **Don't Skip Viewport Testing**
   - Always check all three modes
   - Validate text doesn't overflow

4. **Don't Mix Type Scales Arbitrarily**
   - Follow semantic meaning
   - Maintain predictability

## Accessibility Considerations

### WCAG Compliance

All type scales meet WCAG 2.1 guidelines:

- **Minimum Font Size**: 11px (Caption 2) - acceptable for metadata
- **Body Text**: 16-18px - optimal for readability
- **Line-Height**: 140%+ for body text - ensures readability
- **Contrast**: Use with semantic color tokens for proper contrast

### Responsive Considerations

- **Mobile**: Slightly larger relative line-heights for smaller screens
- **Desktop**: Tighter line-heights as fonts scale up
- **Touch Targets**: Ensure adequate spacing for interactive text

## Migration Guide

### From Old System

If migrating from the old typography system:

1. **Map Old Styles to New Scales**
   ```
   Old: Heading 1 → New: Large Title
   Old: Heading 2 → New: Title 1
   Old: Heading 3 → New: Title 2
   Old: Body Large → New: Body (desktop mode)
   Old: Body → New: Body (mobile mode)
   ```

2. **Update Variable References**
   - Replace hardcoded values with references
   - Bind to responsive variables

3. **Test All Modes**
   - Preview each viewport size
   - Adjust if needed

4. **Update Text Styles**
   - Rebind to new variables
   - Update style names if needed

## Troubleshooting

### Issue: Line-Heights Look Wrong

**Problem**: Text appears too tight or too loose

**Solution**:
1. Check mode is set correctly
2. Verify variable bindings
3. Confirm line-height units (should be px, not %)
4. Re-import tokens if values are incorrect

### Issue: Font Sizes Don't Change with Mode

**Problem**: Text stays same size across modes

**Solution**:
1. Ensure text style is bound to responsive variable
2. Check collection has all 3 modes
3. Verify references resolve correctly
4. Switch modes and observe changes

### Issue: References Not Working

**Problem**: Shows literal text like "{abstractions.type...}"

**Solution**:
1. Import collections in order: primitives → abstractions → responsive
2. Check all referenced tokens exist
3. Verify reference syntax is correct
4. Re-import if needed

## Summary

The ATOM63 responsive type scale provides:

✅ **11 Semantic Type Scales** - From Large Title to Caption 2  
✅ **3 Responsive Modes** - Mobile, Tablet, Desktop  
✅ **Calculated Line-Heights** - Ratios preserved in descriptions  
✅ **Complete Token Hierarchy** - Primitives → Abstractions → Responsive  
✅ **Figma-Ready** - Direct variable binding support  
✅ **iOS Alignment** - Matches Human Interface Guidelines  
✅ **Accessibility Compliant** - Meets WCAG 2.1 standards  

---

**Questions?** See the [main documentation](../README.md) or [responsive tokens guide](RESPONSIVE-TOKENS.md).

