// This file runs in Figma's main thread (no DOM access)
// It handles communication with the Figma API
//
// ATOM63 Design System Sync
// Author: You Zhang (ATOM63)

/// <reference types="@figma/plugin-typings" />

// Import modules
import { parseJSON } from './parsers/token-parsers'
import { createVariablesFromTokens, importStylesFromTokens } from './handlers/import-handler'
import { exportVariablesAsTokens, exportStylesAsTokens } from './handlers/export-handler'

// Show the plugin UI (resizable by default)
figma.showUI(__html__, {
  width: 800,
  height: 700,
  title: 'ATOM63 Design System Sync',
  themeColors: true,
})

// Handle messages from the UI
figma.ui.onmessage = async (msg: { type: string; data?: any }) => {
  switch (msg.type) {
    case 'parse-tokens': {
      const { content } = msg.data
      const parsed = parseJSON(content)
      figma.ui.postMessage({
        type: 'tokens-parsed',
        data: parsed,
      })
      break
    }

    case 'get-collections': {
      const collections = figma.variables.getLocalVariableCollections()
      const collectionsData = collections
        .map(c => ({
          id: c.id,
          name: c.name,
          variableCount: c.variableIds.length,
        }))
        // Sort alphabetically by name
        .sort((a, b) => a.name.localeCompare(b.name))
      figma.ui.postMessage({
        type: 'collections-list',
        data: { collections: collectionsData },
      })
      break
    }

    case 'get-styles': {
      // Get all local styles
      const paintStyles = figma.getLocalPaintStyles()
      const textStyles = figma.getLocalTextStyles()
      const effectStyles = figma.getLocalEffectStyles()
      const gridStyles = figma.getLocalGridStyles()

      // Group styles by category, then by root folder
      const getStyleGroups = (styles: any[]) => {
        const groups = new Set<string>()
        styles.forEach(style => {
          const parts = style.name.split('/')
          const rootFolder = parts.length > 1 ? parts[0] : 'Root'
          groups.add(rootFolder)
        })
        return Array.from(groups).sort()
      }

      const paintGroups = getStyleGroups(paintStyles)
      const textGroups = getStyleGroups(textStyles)
      const effectGroups = getStyleGroups(effectStyles)
      const gridGroups = getStyleGroups(gridStyles)

      const stylesByCategory = {
        paint: paintGroups.map(group => ({
          name: group,
          count: paintStyles.filter(s => {
            const parts = s.name.split('/')
            const rootFolder = parts.length > 1 ? parts[0] : 'Root'
            return rootFolder === group
          }).length
        })),
        text: textGroups.map(group => ({
          name: group,
          count: textStyles.filter(s => {
            const parts = s.name.split('/')
            const rootFolder = parts.length > 1 ? parts[0] : 'Root'
            return rootFolder === group
          }).length
        })),
        effect: effectGroups.map(group => ({
          name: group,
          count: effectStyles.filter(s => {
            const parts = s.name.split('/')
            const rootFolder = parts.length > 1 ? parts[0] : 'Root'
            return rootFolder === group
          }).length
        })),
        grid: gridGroups.map(group => ({
          name: group,
          count: gridStyles.filter(s => {
            const parts = s.name.split('/')
            const rootFolder = parts.length > 1 ? parts[0] : 'Root'
            return rootFolder === group
          }).length
        }))
      }

      figma.ui.postMessage({
        type: 'styles-list',
        data: { 
          stylesByCategory,
          totalCounts: {
            paint: paintStyles.length,
            text: textStyles.length,
            effect: effectStyles.length,
            grid: gridStyles.length,
            total: paintStyles.length + textStyles.length + effectStyles.length + gridStyles.length
          }
        },
      })
      break
    }

    case 'create-variables': {
      const { tokens, collectionName, importMode = 'import' } = msg.data
      // Note: tokens are already filtered by selected collections in the UI
      const results = await createVariablesFromTokens(tokens, collectionName, importMode)
      
      figma.ui.postMessage({
        type: 'variables-created',
        data: results,
      })

      const actionVerb = importMode === 'override' ? 'Updated' : 'Created'
      const skipMsg = results.skipped > 0 ? ` (${results.skipped} skipped)` : ''
      const failMsg = results.failed > 0 ? ` (${results.failed} failed)` : ''
      figma.notify(
        `✅ ${actionVerb} ${results.success} variables${skipMsg}${failMsg}`
      )
      break
    }

    case 'resize-window': {
      const { mode } = msg.data
      if (mode === 'compact') {
        figma.ui.resize(500, 700)
      } else {
        figma.ui.resize(800, 700)
      }
      break
    }

    case 'export-variables': {
      const { collectionIds, colorFormat } = msg.data
      await exportVariablesAsTokens(collectionIds, colorFormat || 'oklch')
      break
    }

    case 'export-styles': {
      console.log('🎨 Export styles message received, data:', msg.data)
      const { selectedGroups, colorFormat } = msg.data
      console.log('📦 Extracted colorFormat:', colorFormat, 'selectedGroups count:', selectedGroups?.length)
      await exportStylesAsTokens(selectedGroups || [], colorFormat || 'oklch')
      break
    }

    case 'import-styles': {
      console.log('📥 Import styles message received')
      const { stylesData, selectedGroups, importMode } = msg.data
      const results = await importStylesFromTokens(stylesData, selectedGroups || [], importMode || 'import')
      
      figma.ui.postMessage({
        type: 'import-complete',
        data: results
      })
      break
    }

    case 'close': {
      figma.closePlugin()
      break
    }

    default:
      break
  }
}
