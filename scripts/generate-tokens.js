#!/usr/bin/env node

/**
 * Generate CSS from Design Tokens
 * 
 * This script dynamically generates CSS files from tokens.json.
 * It automatically adapts to changes in the token file:
 * 
 * ✅ What you CAN change in tokens.json:
 *    - Add/remove/modify token values
 *    - Add/remove token categories (e.g., new color scales)
 *    - Add new collections in $collections
 *    - Add/modify modes in $collections (e.g., Light, Dark, HighContrast)
 *    - Change collection order, names, and descriptions
 *    - Add tokens to existing collections
 * 
 * 🔧 What the script does automatically:
 *    - Reads $collections metadata to discover all collections
 *    - Generates separate CSS files for each collection
 *    - Creates @theme inline blocks for collections with multiple modes
 *    - Handles single-mode (Default) and multi-mode (Light/Dark) collections
 *    - Resolves token references ({primitives.zinc.50} -> var(--color-zinc-50))
 *    - Sorts collections by order property
 * 
 * 📦 Output: Generates CSS files in src/styles/theme/
 *    - {collection}.css for each collection in $collections
 *    - primitives.css, abstractions.css, semantics.css
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Read tokens and styles
const tokensPath = join(rootDir, 'tokens/base/tokens.json')
const stylesPath = join(rootDir, 'tokens/base/styles.json')
const tokens = JSON.parse(readFileSync(tokensPath, 'utf-8'))
const styles = JSON.parse(readFileSync(stylesPath, 'utf-8'))

// Get collections and modes from metadata
const collections = tokens.$collections || {}
const collectionNames = Object.keys(collections).sort((a, b) => {
  return (collections[a].order || 999) - (collections[b].order || 999)
})

/**
 * Get opacity from styles.json for a semantic token
 * Returns opacity value (0-1) or null if not found or opacity is 1
 */
function getOpacityFromStyles(tokenName) {
  const shadcnStyles = styles?.styles?.paint?.shadcn
  if (!shadcnStyles || !shadcnStyles[tokenName]) {
    return null
  }
  
  const style = shadcnStyles[tokenName]
  const fills = style.fills || []
  
  for (const fill of fills) {
    if (fill.opacity !== undefined && fill.opacity < 1) {
      return fill.opacity
    }
  }
  
  return null
}

/**
 * Convert token reference to CSS variable reference
 * {primitives.zinc.50} -> var(--color-zinc-50)
 * {abstractions.surface.50} -> var(--color-surface-50)
 * {semantics.background} -> var(--background)
 * 
 * For semantic tokens with opacity, wraps in color-mix():
 * var(--background) with 90% opacity -> color-mix(in srgb, var(--background), transparent 10%)
 */
function tokenReferenceToCSSVar(reference, tokenName = null, applyOpacity = false) {
  if (!reference.includes('{')) {
    return reference // Not a reference, return as-is
  }
  
  const path = reference.replace(/[{}]/g, '')
  const parts = path.split('.')
  const collection = parts[0]
  
  // Skip collection name (primitives/abstractions/semantics)
  const tokenPath = parts.slice(1).join('-')
  
  // Build the base variable reference
  let varReference
  if (collection === 'semantics') {
    varReference = `var(--${tokenPath})`
  } else {
    varReference = `var(--color-${tokenPath})`
  }
  
  // Apply opacity if requested and available
  if (applyOpacity && tokenName) {
    const opacity = getOpacityFromStyles(tokenName)
    if (opacity !== null) {
      // Calculate transparency percentage from opacity
      // opacity 0.9 = 10% transparent, opacity 0.4 = 60% transparent
      const transparencyPercent = Math.round((1 - opacity) * 100)
      return `color-mix(in srgb, ${varReference}, transparent ${transparencyPercent}%)`
    }
  }
  
  return varReference
}

/**
 * Resolve token reference like {primitives.zinc.50}
 * Used only for primitives (which have no references)
 */
function resolveTokenReference(reference, allTokens, mode) {
  const path = reference.replace(/[{}]/g, '')
  const parts = path.split('.')

  let current = allTokens
  for (const part of parts) {
    if (!current?.[part]) {
      console.warn(`Token reference not found: ${reference}`)
      return reference
    }
    current = current[part]
  }

  if (typeof current === 'object' && current !== null) {
    if (current.modes && mode) {
      const modeValue = current.modes[mode]
      if (typeof modeValue === 'string' && modeValue.includes('{')) {
        return resolveTokenReference(modeValue, allTokens, mode)
      }
      return modeValue
    }
    if (current.value !== undefined) {
      const value = current.value
      if (typeof value === 'string' && value.includes('{')) {
        return resolveTokenReference(value, allTokens, mode)
      }
      return value
    }
  }

  return current
}

/**
 * Get tokens for a collection (with CSS var references for non-primitives)
 * Returns both the resolved values and their types
 */
function getResolvedTokens(collection, mode) {
  const resolved = {}
  const tokenTypes = {} // Track token types for proper prefix generation
  const tokenGroup = tokens.tokens[collection]
  const isPrimitives = collection === 'primitives'
  const isSemantics = collection === 'semantics'

  function flattenTokens(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const tokenPath = prefix ? `${prefix}-${key}` : key

      if (value && typeof value === 'object') {
        if ('type' in value && value.collection === collection) {
          // Store the token type for prefix generation
          tokenTypes[tokenPath] = value.type
          
          if (value.modes && mode) {
            const modeValue = value.modes[mode]
            if (typeof modeValue === 'string') {
              // For semantic tokens, convert references to CSS vars with opacity support
              resolved[tokenPath] = modeValue.includes('{') && !isPrimitives
                ? tokenReferenceToCSSVar(modeValue, tokenPath, isSemantics)
                : (modeValue.includes('{') ? resolveTokenReference(modeValue, tokens.tokens, mode) : modeValue)
            }
          } else if (value.value !== undefined) {
            const val = value.value
            // For abstractions, convert references to CSS vars
            // For primitives, resolve to actual values
            if (typeof val === 'string' && val.includes('{')) {
              resolved[tokenPath] = isPrimitives 
                ? resolveTokenReference(val, tokens.tokens, mode)
                : tokenReferenceToCSSVar(val, tokenPath, isSemantics)
            } else {
              resolved[tokenPath] = String(val)
            }
          }
        } else if (!('type' in value)) {
          flattenTokens(value, tokenPath)
        }
      }
    }
  }

  flattenTokens(tokenGroup)
  return { resolved, tokenTypes }
}

/**
 * Get CSS variable prefix based on token type
 */
function getPrefixForType(tokenType) {
  const typeMap = {
    'color': 'color',
    'spacing': 'spacing',
    'sizing': 'size',
    'borderRadius': 'radius'
  }
  return typeMap[tokenType] || 'color'
}

/**
 * Generate CSS variables with type-appropriate prefixes
 */
function generateCSSVariables(collection, mode) {
  const { resolved, tokenTypes } = getResolvedTokens(collection, mode)
  const cssVars = []

  for (const [key, value] of Object.entries(resolved)) {
    let varName = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    const tokenType = tokenTypes[key]
    const prefix = getPrefixForType(tokenType)
    
    // For semantics collection, no prefix needed
    if (collection === 'semantics') {
      cssVars.push(`  --${varName}: ${value};`)
    } else {
      // Remove redundant category prefix from token name
      // e.g., "spacing-0" instead of "spacing-spacing-0"
      // "sizes-1" instead of "sizes-sizes-1"
      if (varName.startsWith('spacing-')) {
        varName = varName.replace('spacing-', '')
      } else if (varName.startsWith('sizes-')) {
        varName = varName.replace('sizes-', '')
      } else if (varName.startsWith('radius-')) {
        varName = varName.replace('radius-', '')
      }
      
      cssVars.push(`  --${prefix}-${varName}: ${value};`)
    }
  }

  return cssVars.join('\n')
}

/**
 * Generate @theme inline block for Tailwind CSS
 * Makes tokens available as utility classes
 * Works for semantics (with modes) and abstractions/primitives (single mode)
 */
function generateTailwindThemeInline(collectionName) {
  const collectionMeta = collections[collectionName]
  if (!collectionMeta || !collectionMeta.modes || collectionMeta.modes.length === 0) {
    return ''
  }

  // Use first mode to get token keys
  const firstMode = collectionMeta.modes[0]
  const { resolved, tokenTypes } = getResolvedTokens(collectionName, firstMode)
  const themeVars = []

  for (const key of Object.keys(resolved)) {
    let varName = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    const tokenType = tokenTypes[key]
    const prefix = getPrefixForType(tokenType)
    
    // For primitives, only include spacing, sizing, and borderRadius tokens
    // Skip colors (too many tokens)
    if (collectionName === 'primitives') {
      if (tokenType !== 'spacing' && tokenType !== 'sizing' && tokenType !== 'borderRadius') {
        continue
      }
    }
    
    // Map to CSS variable reference for Tailwind
    // For semantic tokens: --color-background: var(--background);
    // For abstractions: --color-surface-50: var(--color-surface-50);
    if (collectionName === 'semantics') {
      const cssVar = `--${varName}`
      themeVars.push(`  --color-${varName}: var(${cssVar});`)
    } else {
      // Remove redundant category prefix from token name
      if (varName.startsWith('spacing-')) {
        varName = varName.replace('spacing-', '')
      } else if (varName.startsWith('sizes-')) {
        varName = varName.replace('sizes-', '')
      } else if (varName.startsWith('radius-')) {
        varName = varName.replace('radius-', '')
      }
      
      // For abstractions and primitives, use the appropriate prefix
      const cssVar = `--${prefix}-${varName}`
      themeVars.push(`  ${cssVar}: var(${cssVar});`)
    }
  }

  if (themeVars.length === 0) {
    return ''
  }

  const description = collectionMeta.description || `${collectionMeta.name} tokens`
  return `/* Tailwind CSS Theme - ${description} */\n@theme inline {\n${themeVars.join('\n')}\n}\n`
}

/**
 * Generate CSS file for a collection
 */
function generateCollectionCSS(collectionName) {
  const collectionMeta = collections[collectionName]
  if (!collectionMeta) {
    console.warn(`⚠️  Collection not found in metadata: ${collectionName}`)
    return ''
  }

  const { name, description, modes = [] } = collectionMeta
  const hasModes = modes.length > 1 // More than just "Default"

  let css = `/* =====================================================
   ${name} - Auto-generated from tokens.json
   DO NOT EDIT THIS FILE DIRECTLY
   Edit tokens.json and regenerate using bun run tokens
   ===================================================== */

/* ${description} */

`

  // Add Tailwind theme inline block for semantics (with modes), abstractions, and primitives
  if (hasModes || collectionName === 'abstractions' || collectionName === 'primitives') {
    const themeInline = generateTailwindThemeInline(collectionName)
    if (themeInline) {
      css += themeInline
    }
  }

  // Generate CSS for each mode
  if (hasModes) {
    // Multiple modes (like Light/Dark)
    for (const mode of modes) {
      const selector = mode === 'Light' ? ':root' : `.${mode.toLowerCase()}`
      const modeLabel = mode === 'Light' ? 'Light Theme' : `${mode} Theme`
      
      css += `/* ${modeLabel} */\n${selector} {\n${generateCSSVariables(collectionName, mode)}\n}\n\n`
    }
  } else {
    // Single mode (like Default for primitives/abstractions)
    css += `:root {\n${generateCSSVariables(collectionName, modes[0] || undefined)}\n}\n`
  }

  return css
}

// Generate and write CSS files for each collection
const themePath = join(rootDir, 'tokens/styles')
const generatedFiles = []

for (const collectionName of collectionNames) {
  const collectionMeta = collections[collectionName]
  const css = generateCollectionCSS(collectionName)
  
  if (!css) {
    continue
  }

  // Generate filename: primitives.css, abstractions.css, semantics.css
  const filename = `${collectionName}.css`
  const filepath = join(themePath, filename)
  
  writeFileSync(filepath, css, 'utf-8')
  
  // Count tokens
  const modes = collectionMeta.modes || []
  const firstMode = modes[0]
  const { resolved } = getResolvedTokens(collectionName, firstMode)
  const tokenCount = Object.keys(resolved).length
  const modeInfo = modes.length > 1 ? ` (${modes.length} modes)` : ''
  
  generatedFiles.push({
    filename,
    tokenCount,
    modeInfo,
  })
}

// Log results
console.log('✅ Generated token files:')
for (const { filename, tokenCount, modeInfo } of generatedFiles) {
  console.log(`   - ${filename} (${tokenCount} tokens${modeInfo})`)
}
console.log(`   📁 ${themePath}`)

