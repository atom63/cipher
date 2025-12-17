/**
 * Design Token Parser
 * Parses design tokens JSON and resolves references
 */

import type { DesignToken, DesignTokens } from '../types'

/**
 * Check if value is a token object with modes
 */
function hasModesProperty(obj: unknown): obj is { modes: Record<string, string> } {
  return typeof obj === 'object' && obj !== null && 'modes' in obj
}

/**
 * Check if value is a token object with value property
 */
function hasValueProperty(obj: unknown): obj is { value: string | number } {
  return typeof obj === 'object' && obj !== null && 'value' in obj
}

/**
 * Resolve token reference like {primitives.zinc.50}
 */
function resolveTokenReference(
  reference: string,
  tokens: DesignTokens['tokens'],
  mode?: string
): string {
  const path = reference.replace(/[{}]/g, '')
  const parts = path.split('.')

  let current: unknown = tokens

  for (const part of parts) {
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return reference
    }
    current = (current as Record<string, unknown>)[part]
  }

  return resolveTokenValue(current, tokens, mode)
}

/**
 * Resolve token value (extracted to reduce complexity)
 */
function resolveTokenValue(
  current: unknown,
  tokens: DesignTokens['tokens'],
  mode: string | undefined
): string {
  if (typeof current !== 'object' || current === null) {
    return String(current)
  }

  // Check for modes
  if (hasModesProperty(current) && mode && current.modes[mode]) {
    const modeValue = current.modes[mode]
    if (typeof modeValue === 'string' && modeValue.includes('{')) {
      return resolveTokenReference(modeValue, tokens, mode)
    }
    return modeValue
  }

  // Check for direct value
  if (hasValueProperty(current)) {
    const value = current.value
    if (typeof value === 'string' && value.includes('{')) {
      return resolveTokenReference(value, tokens, mode)
    }
    return String(value)
  }

  return String(current)
}

/**
 * Check if object is a token definition
 */
function isTokenDefinition(obj: unknown, collection: string): obj is DesignToken {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  const hasType = 'type' in obj
  const hasCollection = 'collection' in obj
  const hasRequiredProps = hasType && hasCollection

  if (!hasRequiredProps) {
    return false
  }

  const token = obj as { collection: string }
  return token.collection === collection
}

/**
 * Process token with modes
 */
function processTokenWithModes(
  token: DesignToken,
  tokenPath: string,
  mode: string,
  designTokens: DesignTokens,
  resolved: Record<string, string>
): void {
  if (!token.modes) {
    return
  }

  const modeValue = token.modes[mode]
  if (typeof modeValue !== 'string') {
    return
  }

  resolved[tokenPath] = modeValue.includes('{')
    ? resolveTokenReference(modeValue, designTokens.tokens, mode)
    : modeValue
}

/**
 * Process token with direct value
 */
function processTokenWithValue(
  token: DesignToken,
  tokenPath: string,
  mode: string | undefined,
  designTokens: DesignTokens,
  resolved: Record<string, string>
): void {
  if (token.value === undefined) {
    return
  }

  const val = token.value
  const isStringWithRef = typeof val === 'string' && val.includes('{')

  resolved[tokenPath] = isStringWithRef
    ? resolveTokenReference(val, designTokens.tokens, mode)
    : String(val)
}

/**
 * Process a single token entry
 */
function processTokenEntry(
  value: unknown,
  tokenPath: string,
  collection: string,
  mode: string | undefined,
  designTokens: DesignTokens,
  resolved: Record<string, string>,
  flattenCallback: (obj: Record<string, unknown>, prefix: string) => void
): void {
  if (!value || typeof value !== 'object') {
    return
  }

  // Check if it's a token definition
  if (isTokenDefinition(value, collection)) {
    if (value.modes && mode) {
      processTokenWithModes(value, tokenPath, mode, designTokens, resolved)
    } else if (value.value !== undefined) {
      processTokenWithValue(value, tokenPath, mode, designTokens, resolved)
    }
    return
  }

  // Nested object, recurse
  if (!('type' in value)) {
    flattenCallback(value as Record<string, unknown>, tokenPath)
  }
}

/**
 * Get all resolved tokens for a specific mode
 */
export function getResolvedTokens(
  designTokens: DesignTokens,
  collection: 'primitives' | 'abstractions' | 'semantics',
  mode?: 'Light' | 'Dark'
): Record<string, string> {
  const resolved: Record<string, string> = {}
  const tokens = designTokens.tokens[collection]

  function flattenTokens(obj: Record<string, unknown>, prefix = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const tokenPath = prefix ? `${prefix}-${key}` : key
      processTokenEntry(value, tokenPath, collection, mode, designTokens, resolved, flattenTokens)
    }
  }

  flattenTokens(tokens as Record<string, unknown>)
  return resolved
}

/**
 * Generate CSS custom properties from tokens
 */
export function generateCSSVariables(
  designTokens: DesignTokens,
  options: {
    collection: 'primitives' | 'abstractions' | 'semantics'
    mode?: 'Light' | 'Dark'
    prefix?: string
  }
): string {
  const { collection, mode, prefix = 'color' } = options
  const resolved = getResolvedTokens(designTokens, collection, mode)

  const cssVars: string[] = []

  for (const [key, value] of Object.entries(resolved)) {
    // Convert camelCase or kebab-case to proper CSS variable format
    const varName = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    cssVars.push(`  --${prefix}-${varName}: ${value};`)
  }

  return cssVars.join('\n')
}

/**
 * Generate Tailwind CSS @theme inline block for semantic tokens
 * This makes CSS variables available as Tailwind utility classes
 */
export function generateTailwindThemeInline(designTokens: DesignTokens): string {
  const resolved = getResolvedTokens(designTokens, 'semantics', 'Light')

  const themeVars: string[] = []

  for (const key of Object.keys(resolved)) {
    // Convert token key to CSS variable format
    const varName = key.replace(/([A-Z])/g, '-$1').toLowerCase()

    // Map to the CSS variable reference
    // e.g., --color-background: var(--background);
    themeVars.push(`  --color-${varName}: var(--${varName});`)
  }

  return `/* CSS Custom Properties - Available as Tailwind utility classes */\n@theme inline {\n${themeVars.join('\n')}\n}\n`
}

/**
 * Generate complete CSS theme from tokens
 */
export function generateThemeCSS(designTokens: DesignTokens): {
  primitives: string
  tailwindTheme: string
  light: string
  dark: string
} {
  return {
    primitives: `/* Primitive Tokens */\n:root {\n${generateCSSVariables(designTokens, { collection: 'primitives' })}\n}\n`,
    tailwindTheme: generateTailwindThemeInline(designTokens),
    light: `/* Light Theme */\n:root,\n.light {\n${generateCSSVariables(designTokens, { collection: 'abstractions' })}\n\n${generateCSSVariables(designTokens, { collection: 'semantics', mode: 'Light' })}\n}\n`,
    dark: `/* Dark Theme */\n.dark {\n${generateCSSVariables(designTokens, { collection: 'abstractions' })}\n\n${generateCSSVariables(designTokens, { collection: 'semantics', mode: 'Dark' })}\n}\n`,
  }
}
