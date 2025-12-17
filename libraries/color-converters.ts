// Color conversion utilities
// Handles conversion between RGB, HEX, RGBA, and OKLCH color formats

/// <reference types="@figma/plugin-typings" />

// Convert RGB to HEX
export function rgbToHex(color: RGB & { a?: number }): string {
  const toHex = (val: number) => {
    const hex = Math.round(val * 255).toString(16).padStart(2, '0')
    return hex
  }
  
  const hexColor = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`
  
  // Add alpha if present and not fully opaque
  if ('a' in color && color.a !== undefined && color.a < 1) {
    return `${hexColor}${toHex(color.a)}`
  }
  
  return hexColor
}

// Convert RGB to RGBA string
export function rgbToRgba(color: RGB & { a?: number }): string {
  const r = Math.round(color.r * 255)
  const g = Math.round(color.g * 255)
  const b = Math.round(color.b * 255)
  const a = 'a' in color && color.a !== undefined ? color.a : 1
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

// Convert Figma color to OKLCH string
export function rgbToOklch(color: RGB & { a?: number }): string {
  // Convert sRGB to linear RGB (remove gamma correction)
  const toLinear = (val: number) => {
    if (val <= 0.04045) return val / 12.92
    return Math.pow((val + 0.055) / 1.055, 2.4)
  }
  
  const r = toLinear(color.r)
  const g = toLinear(color.g)
  const b = toLinear(color.b)
  
  // Convert linear RGB to OKLab
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
  
  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)
  
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
  const bVal = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  
  // Convert OKLab to OKLCH
  const C = Math.sqrt(a * a + bVal * bVal)
  let H = Math.atan2(bVal, a) * 180 / Math.PI
  
  // Normalize hue to 0-360
  if (H < 0) H += 360
  
  // Handle alpha channel (OKLCH supports / alpha syntax)
  const alpha = 'a' in color && color.a !== undefined ? color.a : 1
  
  // Format with appropriate precision
  if (alpha < 1) {
    return `oklch(${L.toFixed(6)} ${C.toFixed(6)} ${H.toFixed(6)} / ${alpha.toFixed(6)})`
  }
  return `oklch(${L.toFixed(6)} ${C.toFixed(6)} ${H.toFixed(6)})`
}

// Convert RGB/RGBA to specified format
export function convertColor(color: RGB | RGBA, format: string): string {
  switch (format) {
    case 'hex':
      return rgbToHex(color)
    case 'rgba':
      return rgbToRgba(color)
    case 'oklch':
    default:
      return rgbToOklch(color)
  }
}

