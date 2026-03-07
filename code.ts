// This file runs in Figma's main thread (no DOM access)
// It handles communication with the Figma API
//
// Cipher - Figma Design System Plugin
// Author: You Zhang (ATOM63)

/// <reference types="@figma/plugin-typings" />

// Import modules
import { parseJSON } from './parsers/token-parsers'
import { createVariablesFromTokens, importStylesFromTokens } from './handlers/import-handler'
import { exportVariablesAsTokens, exportStylesAsTokens } from './handlers/export-handler'
import { generateCSS } from './handlers/css-generator'
import type { UIToMainMessage, PluginSettings } from './types/messages'

// Show the plugin UI (resizable by default)
figma.showUI(__html__, {
  width: 800,
  height: 700,
  title: 'Cipher',
  themeColors: true,
})

// Group styles by root folder, returning name + count pairs
function groupStylesByRoot(styles: { name: string }[]): { name: string; count: number }[] {
  const groups = new Map<string, number>()
  for (const style of styles) {
    const parts = style.name.split('/')
    const rootFolder = parts.length > 1 ? parts[0] : 'Root'
    groups.set(rootFolder, (groups.get(rootFolder) ?? 0) + 1)
  }
  return Array.from(groups, ([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name))
}

// Settings persistence via clientStorage
const DEFAULT_SETTINGS: PluginSettings = {
  colorFormat: 'oklch',
  lastExportTab: 'variables',
}

async function loadSettings(): Promise<PluginSettings> {
  const stored = await figma.clientStorage.getAsync('settings')
  return { ...DEFAULT_SETTINGS, ...stored }
}

async function saveSettings(partial: Partial<PluginSettings>): Promise<PluginSettings> {
  const current = await loadSettings()
  const updated = { ...current, ...partial }
  await figma.clientStorage.setAsync('settings', updated)
  return updated
}

// Handle messages from the UI
figma.ui.onmessage = async (msg: UIToMainMessage) => {
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
        .sort((a, b) => a.name.localeCompare(b.name))
      figma.ui.postMessage({
        type: 'collections-list',
        data: { collections: collectionsData },
      })
      break
    }

    case 'get-styles': {
      const paintStyles = figma.getLocalPaintStyles()
      const textStyles = figma.getLocalTextStyles()
      const effectStyles = figma.getLocalEffectStyles()
      const gridStyles = figma.getLocalGridStyles()

      const stylesByCategory = {
        paint: groupStylesByRoot(paintStyles),
        text: groupStylesByRoot(textStyles),
        effect: groupStylesByRoot(effectStyles),
        grid: groupStylesByRoot(gridStyles),
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

    case 'get-variables': {
      const collections = figma.variables.getLocalVariableCollections()
      const filterIds = msg.data?.collectionIds
      const filteredCollections = filterIds
        ? collections.filter(c => filterIds.includes(c.id))
        : collections

      const collectionsData = filteredCollections
        .map(c => ({ id: c.id, name: c.name, variableCount: c.variableIds.length }))
        .sort((a, b) => a.name.localeCompare(b.name))

      const variables: {
        id: string
        name: string
        resolvedType: string
        collectionId: string
        collectionName: string
        valuesByMode: Record<string, string>
        description: string
      }[] = []

      for (const collection of filteredCollections) {
        const modeNames = new Map(collection.modes.map(m => [m.modeId, m.name]))
        for (const varId of collection.variableIds) {
          const variable = figma.variables.getVariableById(varId)
          if (!variable) continue

          const valuesByMode: Record<string, string> = {}
          for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
            const modeName = modeNames.get(modeId) || modeId
            if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'VARIABLE_ALIAS') {
              const refVar = figma.variables.getVariableById((value as VariableAlias).id)
              valuesByMode[modeName] = refVar ? `{${refVar.name}}` : String(value)
            } else if (typeof value === 'object' && value !== null && 'r' in value) {
              const c = value as RGBA
              const r = Math.round(c.r * 255)
              const g = Math.round(c.g * 255)
              const b = Math.round(c.b * 255)
              valuesByMode[modeName] = c.a < 1
                ? `rgba(${r}, ${g}, ${b}, ${c.a.toFixed(2)})`
                : `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
            } else {
              valuesByMode[modeName] = String(value)
            }
          }

          variables.push({
            id: variable.id,
            name: variable.name,
            resolvedType: variable.resolvedType,
            collectionId: collection.id,
            collectionName: collection.name,
            valuesByMode,
            description: variable.description,
          })
        }
      }

      figma.ui.postMessage({
        type: 'variables-list',
        data: { variables, collections: collectionsData },
      })
      break
    }

    case 'rename-variables': {
      const { renames } = msg.data
      let success = 0
      let failed = 0
      const previousNames: { id: string; oldName: string }[] = []
      for (const { id, newName } of renames) {
        try {
          const variable = figma.variables.getVariableById(id)
          if (variable) {
            previousNames.push({ id, oldName: variable.name })
            variable.name = newName
            success++
          } else {
            failed++
          }
        } catch {
          failed++
        }
      }
      figma.ui.postMessage({ type: 'variables-renamed', data: { success, failed, previousNames } })
      figma.notify(`Renamed ${success} variable${success !== 1 ? 's' : ''}${failed > 0 ? ` (${failed} failed)` : ''}`)
      break
    }

    case 'delete-variables': {
      const { variableIds } = msg.data
      let success = 0
      let failed = 0
      const snapshots: {
        name: string
        resolvedType: string
        collectionId: string
        description: string
        valuesByMode: Record<string, any>
      }[] = []

      for (const id of variableIds) {
        try {
          const variable = figma.variables.getVariableById(id)
          if (variable) {
            // Snapshot before deleting for undo
            const rawValues: Record<string, any> = {}
            for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
              rawValues[modeId] = value
            }
            snapshots.push({
              name: variable.name,
              resolvedType: variable.resolvedType,
              collectionId: variable.variableCollectionId,
              description: variable.description,
              valuesByMode: rawValues,
            })
            variable.remove()
            success++
          } else {
            failed++
          }
        } catch {
          failed++
        }
      }
      figma.ui.postMessage({ type: 'variables-deleted', data: { success, failed, snapshots } })
      figma.notify(`Deleted ${success} variable${success !== 1 ? 's' : ''}${failed > 0 ? ` (${failed} failed)` : ''}`)
      break
    }

    case 'restore-variables': {
      const { snapshots } = msg.data
      let success = 0
      let failed = 0
      for (const snap of snapshots) {
        try {
          const collection = figma.variables.getVariableCollectionById(snap.collectionId)
          if (!collection) { failed++; continue }

          const figmaType = snap.resolvedType as 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'
          const variable = figma.variables.createVariable(snap.name, collection, figmaType)
          variable.description = snap.description

          for (const [modeId, value] of Object.entries(snap.valuesByMode)) {
            try {
              variable.setValueForMode(modeId, value)
            } catch {
              // Mode may no longer exist
            }
          }
          success++
        } catch {
          failed++
        }
      }
      figma.ui.postMessage({ type: 'variables-restored', data: { success, failed } })
      figma.notify(`Restored ${success} variable${success !== 1 ? 's' : ''}${failed > 0 ? ` (${failed} failed)` : ''}`)
      break
    }

    case 'move-variables': {
      const { variableIds, targetCollectionId } = msg.data
      const targetCollection = figma.variables.getVariableCollectionById(targetCollectionId)
      if (!targetCollection) {
        figma.ui.postMessage({ type: 'variables-moved', data: { success: 0, failed: variableIds.length, previousCollections: [] } })
        figma.notify('Target collection not found')
        break
      }

      let success = 0
      let failed = 0
      const previousCollections: { id: string; collectionId: string }[] = []

      // Build target mode map: match modes by name
      const targetModeMap = new Map(targetCollection.modes.map(m => [m.name, m.modeId]))

      for (const id of variableIds) {
        try {
          const variable = figma.variables.getVariableById(id)
          if (!variable) { failed++; continue }
          if (variable.variableCollectionId === targetCollectionId) { continue } // Already there

          const sourceCollection = figma.variables.getVariableCollectionById(variable.variableCollectionId)
          if (!sourceCollection) { failed++; continue }

          const sourceModeMap = new Map(sourceCollection.modes.map(m => [m.modeId, m.name]))

          previousCollections.push({ id, collectionId: variable.variableCollectionId })

          // Create new variable in target collection
          const newVar = figma.variables.createVariable(variable.name, targetCollection, variable.resolvedType as 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN')
          newVar.description = variable.description

          // Copy values, matching modes by name
          for (const [sourceModeId, value] of Object.entries(variable.valuesByMode)) {
            const modeName = sourceModeMap.get(sourceModeId)
            if (!modeName) continue
            const targetModeId = targetModeMap.get(modeName)
            if (targetModeId) {
              try { newVar.setValueForMode(targetModeId, value) } catch {}
            }
          }

          // Remove original
          variable.remove()
          success++
        } catch {
          failed++
        }
      }
      figma.ui.postMessage({ type: 'variables-moved', data: { success, failed, previousCollections } })
      figma.notify(`Moved ${success} variable${success !== 1 ? 's' : ''} to "${targetCollection.name}"${failed > 0 ? ` (${failed} failed)` : ''}`)
      break
    }

    case 'duplicate-variables': {
      const { variableIds } = msg.data
      let success = 0
      let failed = 0
      const newVariableIds: string[] = []

      for (const id of variableIds) {
        try {
          const variable = figma.variables.getVariableById(id)
          if (!variable) { failed++; continue }

          const collection = figma.variables.getVariableCollectionById(variable.variableCollectionId)
          if (!collection) { failed++; continue }

          const newVar = figma.variables.createVariable(
            `${variable.name} copy`,
            collection,
            variable.resolvedType as 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'
          )
          newVar.description = variable.description

          for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
            try { newVar.setValueForMode(modeId, value) } catch {}
          }

          newVariableIds.push(newVar.id)
          success++
        } catch {
          failed++
        }
      }
      figma.ui.postMessage({ type: 'variables-duplicated', data: { success, failed, newVariableIds } })
      figma.notify(`Duplicated ${success} variable${success !== 1 ? 's' : ''}${failed > 0 ? ` (${failed} failed)` : ''}`)
      break
    }

    case 'update-variable-values': {
      const { updates } = msg.data
      let success = 0
      let failed = 0
      const previousValues: { id: string; valuesByMode: Record<string, any> }[] = []

      for (const { id, valuesByMode } of updates) {
        try {
          const variable = figma.variables.getVariableById(id)
          if (!variable) { failed++; continue }

          const collection = figma.variables.getVariableCollectionById(variable.variableCollectionId)
          if (!collection) { failed++; continue }

          // Build mode name → mode ID map for resolving UI keys
          const modeNameToId = new Map(collection.modes.map(m => [m.name, m.modeId]))

          // Snapshot previous values (using mode names as keys for undo roundtrip)
          const prevValues: Record<string, any> = {}
          const modeIdToName = new Map(collection.modes.map(m => [m.modeId, m.name]))
          for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
            const modeName = modeIdToName.get(modeId) || modeId
            prevValues[modeName] = value
          }
          previousValues.push({ id, valuesByMode: prevValues })

          // Apply new values — keys may be mode names (from UI) or mode IDs
          for (const [key, rawValue] of Object.entries(valuesByMode)) {
            const modeId = modeNameToId.get(key) || key
            try {
              let value: any = rawValue

              // Handle alias references: {variable/name} → VARIABLE_ALIAS
              if (typeof rawValue === 'string' && rawValue.startsWith('{') && rawValue.endsWith('}')) {
                const refName = rawValue.slice(1, -1)
                const allVars = figma.variables.getLocalVariables()
                const refVar = allVars.find(v => v.name === refName)
                if (refVar) {
                  value = figma.variables.createVariableAlias(refVar)
                } else {
                  continue // Skip unresolved alias
                }
              } else if (typeof rawValue === 'object' && rawValue !== null) {
                // Already a structured value (e.g. from undo snapshot) — pass through
                value = rawValue
              } else if (variable.resolvedType === 'FLOAT' && typeof rawValue === 'string') {
                value = parseFloat(rawValue)
                if (isNaN(value)) continue
              } else if (variable.resolvedType === 'BOOLEAN' && typeof rawValue === 'string') {
                value = rawValue.toLowerCase() === 'true'
              } else if (variable.resolvedType === 'COLOR' && typeof rawValue === 'string') {
                const hex = rawValue.trim()
                if (hex.startsWith('#') && (hex.length === 7 || hex.length === 9)) {
                  const r = parseInt(hex.slice(1, 3), 16) / 255
                  const g = parseInt(hex.slice(3, 5), 16) / 255
                  const b = parseInt(hex.slice(5, 7), 16) / 255
                  const a = hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1
                  value = { r, g, b, a }
                } else {
                  continue
                }
              }
              variable.setValueForMode(modeId, value)
            } catch {}
          }
          success++
        } catch {
          failed++
        }
      }
      figma.ui.postMessage({ type: 'variable-values-updated', data: { success, failed, previousValues } })
      figma.notify(`Updated ${success} variable${success !== 1 ? 's' : ''}${failed > 0 ? ` (${failed} failed)` : ''}`)
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

    case 'export-css': {
      try {
        const { collectionIds, colorFormat, includeThemeInline, includeColorMix } = msg.data
        const result = generateCSS({
          collectionIds,
          colorFormat: colorFormat || 'oklch',
          includeThemeInline: includeThemeInline ?? false,
          includeColorMix: includeColorMix ?? false,
        })
        figma.ui.postMessage({
          type: 'css-export-complete',
          data: result,
        })
      } catch (error) {
        figma.ui.postMessage({
          type: 'export-error',
          data: { message: error instanceof Error ? error.message : 'CSS export failed' },
        })
      }
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

    case 'load-settings': {
      const settings = await loadSettings()
      figma.ui.postMessage({
        type: 'settings-loaded',
        data: settings,
      })
      break
    }

    case 'save-settings': {
      await saveSettings(msg.data)
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
