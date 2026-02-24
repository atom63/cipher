/**
 * Cipher - Figma Design System Plugin
 * Type-safe message interfaces for UI ↔ Main thread communication
 */

import type { DesignToken, ParsedTokens } from './tokens'
import type { ImportResults } from '../libraries/shared-types'

// ============================================================================
// COLLECTION & STYLE DATA TYPES
// ============================================================================

/** Collection summary for UI display */
export interface CollectionInfo {
  id: string
  name: string
  variableCount: number
}

/** Style group for UI display */
export interface StyleGroup {
  name: string
  count: number
}

/** Style groups organized by category */
export interface StylesByCategory {
  paint: StyleGroup[]
  text: StyleGroup[]
  effect: StyleGroup[]
  grid: StyleGroup[]
}

/** Style counts by category */
export interface StyleCounts {
  paint: number
  text: number
  effect: number
  grid: number
  total: number
}

/** Selected style group for export/import */
export interface SelectedStyleGroup {
  category: 'paint' | 'text' | 'effect' | 'grid'
  group: string
}

// ============================================================================
// UI → MAIN THREAD MESSAGES
// ============================================================================

/** Parse token JSON content */
export interface ParseTokensMessage {
  type: 'parse-tokens'
  data: {
    content: string
  }
}

/** Request list of Figma variable collections */
export interface GetCollectionsMessage {
  type: 'get-collections'
}

/** Request list of Figma styles grouped by category */
export interface GetStylesMessage {
  type: 'get-styles'
}

/** Create Figma variables from parsed tokens */
export interface CreateVariablesMessage {
  type: 'create-variables'
  data: {
    tokens: DesignToken[]
    collectionName: string
    importMode?: 'import' | 'override'
    selectedCollections?: string[]
  }
}

/** Export Figma variables as tokens */
export interface ExportVariablesMessage {
  type: 'export-variables'
  data: {
    collectionIds: string[]
    colorFormat: 'oklch' | 'hex' | 'rgba' | 'hsl'
  }
}

/** Export Figma styles as tokens */
export interface ExportStylesMessage {
  type: 'export-styles'
  data: {
    selectedGroups: SelectedStyleGroup[]
    colorFormat: 'oklch' | 'hex' | 'rgba' | 'hsl'
  }
}

/** Import styles from token data */
export interface ImportStylesMessage {
  type: 'import-styles'
  data: {
    stylesData: any // Flexible structure from exported styles
    selectedGroups: SelectedStyleGroup[]
    importMode: 'import' | 'override'
  }
}

/** Resize plugin window */
export interface ResizeWindowMessage {
  type: 'resize-window'
  data: {
    mode: 'compact' | 'default'
  }
}

/** Close the plugin */
export interface CloseMessage {
  type: 'close'
}

/** Union of all UI → Main thread messages */
export type UIToMainMessage =
  | ParseTokensMessage
  | GetCollectionsMessage
  | GetStylesMessage
  | CreateVariablesMessage
  | ExportVariablesMessage
  | ExportStylesMessage
  | ImportStylesMessage
  | ResizeWindowMessage
  | CloseMessage

// ============================================================================
// MAIN THREAD → UI MESSAGES
// ============================================================================

/** Tokens have been parsed */
export interface TokensParsedMessage {
  type: 'tokens-parsed'
  data: ParsedTokens
}

/** List of available collections */
export interface CollectionsListMessage {
  type: 'collections-list'
  data: {
    collections: CollectionInfo[]
  }
}

/** List of available styles */
export interface StylesListMessage {
  type: 'styles-list'
  data: {
    stylesByCategory: StylesByCategory
    totalCounts: StyleCounts
  }
}

/** Variables have been created */
export interface VariablesCreatedMessage {
  type: 'variables-created'
  data: ImportResults
}

/** Import operation complete */
export interface ImportCompleteMessage {
  type: 'import-complete'
  data: ImportResults
}

/** Variable export complete */
export interface ExportCompleteMessage {
  type: 'export-complete'
  data: {
    tokens: any // Token structure with $schema, $collections, tokens
    collectionCount: number
    variableCount: number
    format: string
  }
}

/** Style export complete */
export interface StylesExportCompleteMessage {
  type: 'styles-export-complete'
  data: {
    styles: any // Style structure with $schema, $counts, styles
    counts: {
      paint: number
      text: number
      effect: number
      grid: number
      total: number
    }
    format: string
  }
}

/** Export error occurred */
export interface ExportErrorMessage {
  type: 'export-error'
  data: {
    message: string
  }
}

/** Progress update during long operations */
export interface ProgressUpdateMessage {
  type: 'progress-update'
  data: {
    current: number
    total: number
    message: string
  }
}

/** General error message */
export interface ErrorMessage {
  type: 'error'
  data: {
    message: string
    details?: any
  }
}

/** Union of all Main thread → UI messages */
export type MainToUIMessage =
  | TokensParsedMessage
  | CollectionsListMessage
  | StylesListMessage
  | VariablesCreatedMessage
  | ImportCompleteMessage
  | ExportCompleteMessage
  | StylesExportCompleteMessage
  | ExportErrorMessage
  | ProgressUpdateMessage
  | ErrorMessage

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** All possible message types */
export type PluginMessage = UIToMainMessage | MainToUIMessage

/** Extract message type strings */
export type UIToMainMessageType = UIToMainMessage['type']
export type MainToUIMessageType = MainToUIMessage['type']
export type PluginMessageType = PluginMessage['type']

/** Helper to extract data type for a specific message type */
export type MessageDataType<T extends PluginMessageType> = Extract<
  PluginMessage,
  { type: T }
> extends { data: infer D }
  ? D
  : never

// ============================================================================
// TYPE GUARDS
// ============================================================================

/** Check if message is a UI → Main message */
export function isUIToMainMessage(msg: unknown): msg is UIToMainMessage {
  if (!msg || typeof msg !== 'object') return false
  const type = (msg as any).type
  return [
    'parse-tokens',
    'get-collections',
    'get-styles',
    'create-variables',
    'export-variables',
    'export-styles',
    'import-styles',
    'resize-window',
    'close',
  ].includes(type)
}

/** Check if message is a Main → UI message */
export function isMainToUIMessage(msg: unknown): msg is MainToUIMessage {
  if (!msg || typeof msg !== 'object') return false
  const type = (msg as any).type
  return [
    'tokens-parsed',
    'collections-list',
    'styles-list',
    'variables-created',
    'import-complete',
    'export-complete',
    'styles-export-complete',
    'export-error',
    'progress-update',
    'error',
  ].includes(type)
}
