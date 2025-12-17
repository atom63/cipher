#!/usr/bin/env node

/**
 * Generate CSS from Design Tokens
 * 
 * This script dynamically generates CSS files from tokens.json using
 * the TypeScript parser and CSS generator utilities.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Read tokens
const tokensPath = join(rootDir, 'tokens/base/tokens.json')
const stylesPath = join(rootDir, 'tokens/base/styles.json')
const tokensData = JSON.parse(readFileSync(tokensPath, 'utf-8'))
const stylesData = JSON.parse(readFileSync(stylesPath, 'utf-8'))

type DesignTokens = {
  $schema: string
  $version: string
  $collections: Record<
    string,
    { name: string; description: string; order: number; modes: string[] }
  >
  tokens: Record<string, unknown>
}

type DesignToken = {
  value?: string | number | { modes: Record<string, string> }
  type: string
  collection: string
  modes?: Record<string, string>
  description?: string
}

const tokens = tokensData as DesignTokens
const collections = tokens.$collections || {}
const collectionNames = Object.keys(collections).sort((a, b) => {
  return (collections[a].order || 999) - (collections[b].order || 999)
})

/**
 * Get opacity from styles.json for a semantic token
 */
function getOpacityFromStyles(tokenName: string): number | null {
  const shadcnStyles = stylesData?.styles?.paint?.shadcn
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
 */
function tokenReferenceToCSSVar(
  reference: string,
  tokenName: string | null = null,
  applyOpacity = false
): string {
  if (!reference.includes('{')) {
    return reference
  }
  
  const path = reference.replace(/[{}]/g, '')
  const parts = path.split('.')
  const collection = parts[0]
  
  const tokenPath = parts.slice(1).join('-')
  
  let varReference: string
  if (collection === 'semantics') {
    varReference = `var(--${tokenPath})`
  } else {
    varReference = `var(--color-${tokenPath})`
  }
  
  if (applyOpacity && tokenName) {
    const opacity = getOpacityFromStyles(tokenName)
    if (opacity !== null) {
      const transparencyPercent = Math.round((1 - opacity) * 100)
      return `color-mix(in srgb, ${varReference}, transparent ${transparencyPercent}%)`
    }
  }
  
  return varReference
}

/**
 * Resolve token reference for primitives
 */
function resolveTokenReference(
  reference: string,
  allTokens: Record<string, unknown>,
  mode?: string
): string {
  const path = reference.replace(/[{}]/g, '')
  const parts = path.split('.')

  let current: unknown = allTokens
  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      console.warn(`Token reference not found: ${reference}`)
      return reference
    }
    current = (current as Record<string, unknown>)[part]
  }

  if (typeof current === 'object' && current !== null) {
    const obj = current as Record<string, unknown>
    if ('modes' in obj && mode) {
      const modes = obj.modes as Record<string, string>
      const modeValue = modes[mode]
      if (typeof modeValue === 'string' && modeValue.includes('{')) {
        return resolveTokenReference(modeValue, allTokens, mode)
      }
      return modeValue
    }
    if ('value' in obj) {
      const value = obj.value
      if (typeof value === 'string' && value.includes('{')) {
        return resolveTokenReference(value, allTokens, mode)
      }
      return String(value)
    }
  }

  return String(current)
}

/**
 * Get resolved tokens for a collection
 */
function getResolvedTokens(collection: string, mode?: string): {
  resolved: Record<string, string>
  tokenTypes: Record<string, string>
} {
  const resolved: Record<string, string> = {}
  const tokenTypes: Record<string, string> = {}
  const tokenGroup = (tokens.tokens as Record<string, unknown>)[collection]
  const isPrimitives = collection === 'primitives'
  const isSemantics = collection === 'semantics'

  function flattenTokens(obj: Record<string, unknown>, prefix = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const tokenPath = prefix ? `${prefix}-${key}` : key

      if (value && typeof value === 'object') {
        const token = value as Record<string, unknown>
        if ('type' in token && token.collection === collection) {
          tokenTypes[tokenPath] = token.type as string
          
          if ('modes' in token && mode) {
            const modes = token.modes as Record<string, string>
            const modeValue = modes[mode]
            if (typeof modeValue === 'string') {
              resolved[tokenPath] = modeValue.includes('{') && !isPrimitives
                ? tokenReferenceToCSSVar(modeValue, tokenPath, isSemantics)
                : (modeValue.includes('{') ? resolveTokenReference(modeValue, tokens.tokens, mode) : modeValue)
            }
          } else if ('value' in token) {
            const val = token.value
            if (typeof val === 'string' && val.includes('{')) {
              resolved[tokenPath] = isPrimitives 
                ? resolveTokenReference(val, tokens.tokens, mode)
                : tokenReferenceToCSSVar(val, tokenPath, isSemantics)
            } else {
              resolved[tokenPath] = String(val)
            }
          }
        } else if (!('type' in token)) {
          flattenTokens(token, tokenPath)
        }
      }
    }
  }

  flattenTokens(tokenGroup as Record<string, unknown>)
  return { resolved, tokenTypes }
}

/**
 * Get CSS variable prefix based on token type
 */
function getPrefixForType(tokenType: string): string {
  const typeMap: Record<string, string> = {
    'color': 'color',
    'spacing': 'spacing',
    'sizing': 'size',
    'borderRadius': 'radius'
  }
  return typeMap[tokenType] || 'color'
}

/**
 * Generate CSS variables
 */
function generateCSSVariables(collection: string, mode?: string): string {
  const { resolved, tokenTypes } = getResolvedTokens(collection, mode)
  const cssVars: string[] = []

  for (const [key, value] of Object.entries(resolved)) {
    let varName = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    const tokenType = tokenTypes[key]
    const prefix = getPrefixForType(tokenType)
    
    if (collection === 'semantics') {
      cssVars.push(`  --${varName}: ${value};`)
    } else {
      // Remove redundant category prefix
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
 */
function generateTailwindThemeInline(collectionName: string): string {
  const collectionMeta = collections[collectionName]
  if (!collectionMeta || !collectionMeta.modes || collectionMeta.modes.length === 0) {
    return ''
  }

  const firstMode = collectionMeta.modes[0]
  const { resolved, tokenTypes } = getResolvedTokens(collectionName, firstMode)
  const themeVars: string[] = []

  for (const key of Object.keys(resolved)) {
    let varName = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    const tokenType = tokenTypes[key]
    const prefix = getPrefixForType(tokenType)
    
    if (collectionName === 'primitives') {
      if (tokenType !== 'spacing' && tokenType !== 'sizing' && tokenType !== 'borderRadius') {
        continue
      }
    }
    
    if (collectionName === 'semantics') {
      const cssVar = `--${varName}`
      themeVars.push(`  --color-${varName}: var(${cssVar});`)
    } else {
      if (varName.startsWith('spacing-')) {
        varName = varName.replace('spacing-', '')
      } else if (varName.startsWith('sizes-')) {
        varName = varName.replace('sizes-', '')
      } else if (varName.startsWith('radius-')) {
        varName = varName.replace('radius-', '')
      }
      
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
function generateCollectionCSS(collectionName: string): string {
  const collectionMeta = collections[collectionName]
  if (!collectionMeta) {
    console.warn(`⚠️  Collection not found in metadata: ${collectionName}`)
    return ''
  }

  const { name, description, modes = [] } = collectionMeta
  const hasModes = modes.length > 1

  let css = `/* =====================================================
   ${name} - Auto-generated from tokens.json
   DO NOT EDIT THIS FILE DIRECTLY
   Edit tokens.json and regenerate using bun run tokens
   ===================================================== */

/* ${description} */

`

  if (hasModes || collectionName === 'abstractions' || collectionName === 'primitives') {
    const themeInline = generateTailwindThemeInline(collectionName)
    if (themeInline) {
      css += themeInline
    }
  }

  if (hasModes) {
    for (const mode of modes) {
      const selector = mode === 'Light' ? ':root' : `.${mode.toLowerCase()}`
      const modeLabel = mode === 'Light' ? 'Light Theme' : `${mode} Theme`
      
      css += `/* ${modeLabel} */\n${selector} {\n${generateCSSVariables(collectionName, mode)}\n}\n\n`
    }
  } else {
    css += `:root {\n${generateCSSVariables(collectionName, modes[0])}\n}\n`
  }

  return css
}

// Ensure output directory exists
const themePath = join(rootDir, 'tokens/styles')
if (!existsSync(themePath)) {
  mkdirSync(themePath, { recursive: true })
}

// Generate CSS files
const generatedFiles: Array<{
  filename: string
  tokenCount: number
  modeInfo: string
}> = []

for (const collectionName of collectionNames) {
  const collectionMeta = collections[collectionName]
  const css = generateCollectionCSS(collectionName)
  
  if (!css) {
    continue
  }

  const filename = `${collectionName}.css`
  const filepath = join(themePath, filename)
  
  writeFileSync(filepath, css, 'utf-8')
  
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

