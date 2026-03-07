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

/** Export Figma variables as CSS custom properties */
export interface ExportCSSMessage {
  type: 'export-css'
  data: {
    collectionIds: string[]
    colorFormat: 'oklch' | 'hex' | 'rgba' | 'hsl'
    includeThemeInline: boolean
    includeColorMix: boolean
  }
}

/** CSS file in export result */
export interface CSSFileInfo {
  name: string
  content: string
  variableCount: number
}

/** CSS export complete */
export interface CSSExportCompleteMessage {
  type: 'css-export-complete'
  data: {
    files: CSSFileInfo[]
    totalVariables: number
    totalCollections: number
  }
}

/** Request detailed style list for the styles manager */
export interface GetStyleDetailsMessage {
  type: 'get-style-details'
}

/** Individual style info for the styles manager */
export interface StyleInfo {
  id: string
  name: string
  category: 'paint' | 'text' | 'effect' | 'grid'
  description: string
  /** Preview values — depends on category */
  preview: StylePreview
}

/** Individual paint layer info */
export interface PaintInfo {
  paintType: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE' | 'VIDEO'
  /** Hex color for solid paints */
  color?: string
  opacity?: number
  /** Gradient color stops */
  stops?: { color: string; position: number; variable?: string }[]
  /** Variable bound to this paint's color */
  colorVariable?: string
  /** Variable bound to this paint's opacity */
  opacityVariable?: string
}

/** Individual effect layer info */
export interface EffectInfo {
  effectType: string
  description: string
  color?: string
  colorVariable?: string
  radiusVariable?: string
  spreadVariable?: string
}

export type StylePreview =
  | { type: 'paint'; paints: PaintInfo[] }
  | { type: 'text'; fontFamily: string; fontStyle: string; fontSize: string; lineHeight: string; variables?: Record<string, string> }
  | { type: 'effect'; effects: EffectInfo[] }
  | { type: 'grid'; patterns: string[] }

/** Response with style details */
export interface StyleDetailsListMessage {
  type: 'style-details-list'
  data: {
    styles: StyleInfo[]
    counts: StyleCounts
  }
}

/** Delete styles in bulk */
export interface DeleteStylesMessage {
  type: 'delete-styles'
  data: {
    styleIds: string[]
    category: 'paint' | 'text' | 'effect' | 'grid'
  }
}

/** Styles deleted result */
export interface StylesDeletedMessage {
  type: 'styles-deleted'
  data: {
    success: number
    failed: number
  }
}

/** Rename styles in bulk */
export interface RenameStylesMessage {
  type: 'rename-styles'
  data: {
    renames: { id: string; category: 'paint' | 'text' | 'effect' | 'grid'; newName: string }[]
  }
}

/** Styles renamed result */
export interface StylesRenamedMessage {
  type: 'styles-renamed'
  data: {
    success: number
    failed: number
  }
}

/** Scan unbound styles and suggest variable rebindings */
export interface ScanRebindMessage {
  type: 'scan-rebind'
  data: {
    styleIds: string[]
  }
}

/** A suggested rebinding: unbound color → matching variable */
export interface RebindSuggestion {
  styleId: string
  styleName: string
  /** 'solid' for paint color, 'stop:0', 'stop:1' for gradient stops, 'effect:0' for effect colors */
  field: string
  currentColor: string
  suggestedVariableId: string
  suggestedVariableName: string
  matchType: 'exact' | 'name'
}

/** Response with rebind suggestions */
export interface RebindSuggestionsMessage {
  type: 'rebind-suggestions'
  data: {
    suggestions: RebindSuggestion[]
  }
}

/** Apply selected rebindings */
export interface ApplyRebindMessage {
  type: 'apply-rebind'
  data: {
    bindings: {
      styleId: string
      field: string
      variableId: string
    }[]
  }
}

/** Undo rebindings (unbind variables from styles) */
export interface UndoRebindMessage {
  type: 'undo-rebind'
  data: {
    bindings: {
      styleId: string
      field: string
    }[]
  }
}

/** Rebind result */
export interface RebindAppliedMessage {
  type: 'rebind-applied'
  data: {
    success: number
    failed: number
    /** Successfully applied bindings for undo */
    applied: { styleId: string; field: string }[]
  }
}

/** Undo rebind result */
export interface RebindUndoneMessage {
  type: 'rebind-undone'
  data: {
    success: number
    failed: number
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

/** Request all variables with full details for the manage page */
export interface GetVariablesMessage {
  type: 'get-variables'
  data?: {
    collectionIds?: string[]
  }
}

/** Variable detail for manage page display */
export interface VariableInfo {
  id: string
  name: string
  resolvedType: string
  collectionId: string
  collectionName: string
  valuesByMode: Record<string, string>
  description: string
}

/** Response with full variable details */
export interface VariablesListMessage {
  type: 'variables-list'
  data: {
    variables: VariableInfo[]
    collections: CollectionInfo[]
  }
}

/** Rename variables in bulk */
export interface RenameVariablesMessage {
  type: 'rename-variables'
  data: {
    renames: { id: string; newName: string }[]
  }
}

/** Delete variables in bulk */
export interface DeleteVariablesMessage {
  type: 'delete-variables'
  data: {
    variableIds: string[]
  }
}

/** Variables renamed result */
export interface VariablesRenamedMessage {
  type: 'variables-renamed'
  data: {
    success: number
    failed: number
    previousNames: { id: string; oldName: string }[]
  }
}

/** Snapshot of a deleted variable for undo */
export interface DeletedVariableSnapshot {
  name: string
  resolvedType: string
  collectionId: string
  description: string
  valuesByMode: Record<string, any>
}

/** Variables deleted result */
export interface VariablesDeletedMessage {
  type: 'variables-deleted'
  data: {
    success: number
    failed: number
    snapshots: DeletedVariableSnapshot[]
  }
}

/** Restore previously deleted variables */
export interface RestoreVariablesMessage {
  type: 'restore-variables'
  data: {
    snapshots: DeletedVariableSnapshot[]
  }
}

/** Variables restored result */
export interface VariablesRestoredMessage {
  type: 'variables-restored'
  data: {
    success: number
    failed: number
  }
}

/** Move variables to a different collection */
export interface MoveVariablesMessage {
  type: 'move-variables'
  data: {
    variableIds: string[]
    targetCollectionId: string
  }
}

/** Variables moved result */
export interface VariablesMovedMessage {
  type: 'variables-moved'
  data: {
    success: number
    failed: number
    previousCollections: { id: string; collectionId: string }[]
  }
}

/** Duplicate variables */
export interface DuplicateVariablesMessage {
  type: 'duplicate-variables'
  data: {
    variableIds: string[]
  }
}

/** Variables duplicated result */
export interface VariablesDuplicatedMessage {
  type: 'variables-duplicated'
  data: {
    success: number
    failed: number
    newVariableIds: string[]
  }
}

/** Update variable values in bulk */
export interface UpdateVariableValuesMessage {
  type: 'update-variable-values'
  data: {
    updates: {
      id: string
      valuesByMode: Record<string, any>
    }[]
  }
}

/** Variables values updated result */
export interface VariableValuesUpdatedMessage {
  type: 'variable-values-updated'
  data: {
    success: number
    failed: number
    previousValues: {
      id: string
      valuesByMode: Record<string, any>
    }[]
  }
}

/** Close the plugin */
export interface CloseMessage {
  type: 'close'
}

/** Plugin settings stored via clientStorage */
export interface PluginSettings {
  colorFormat: 'oklch' | 'hex' | 'rgba' | 'hsl'
  lastExportTab: 'variables' | 'styles'
}

/** Load settings from clientStorage */
export interface LoadSettingsMessage {
  type: 'load-settings'
}

/** Save settings to clientStorage */
export interface SaveSettingsMessage {
  type: 'save-settings'
  data: Partial<PluginSettings>
}

/** Union of all UI → Main thread messages */
export type UIToMainMessage =
  | ParseTokensMessage
  | GetCollectionsMessage
  | GetStylesMessage
  | GetVariablesMessage
  | CreateVariablesMessage
  | ExportVariablesMessage
  | ExportStylesMessage
  | ExportCSSMessage
  | GetStyleDetailsMessage
  | ImportStylesMessage
  | DeleteStylesMessage
  | RenameStylesMessage
  | RenameVariablesMessage
  | DeleteVariablesMessage
  | RestoreVariablesMessage
  | MoveVariablesMessage
  | DuplicateVariablesMessage
  | UpdateVariableValuesMessage
  | ScanRebindMessage
  | ApplyRebindMessage
  | UndoRebindMessage
  | ResizeWindowMessage
  | LoadSettingsMessage
  | SaveSettingsMessage
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

/** Settings loaded from clientStorage */
export interface SettingsLoadedMessage {
  type: 'settings-loaded'
  data: PluginSettings
}

/** Union of all Main thread → UI messages */
export type MainToUIMessage =
  | TokensParsedMessage
  | CollectionsListMessage
  | StylesListMessage
  | VariablesListMessage
  | VariablesCreatedMessage
  | VariablesRenamedMessage
  | VariablesDeletedMessage
  | VariablesRestoredMessage
  | VariablesMovedMessage
  | VariablesDuplicatedMessage
  | VariableValuesUpdatedMessage
  | ImportCompleteMessage
  | ExportCompleteMessage
  | StylesExportCompleteMessage
  | CSSExportCompleteMessage
  | StyleDetailsListMessage
  | StylesDeletedMessage
  | StylesRenamedMessage
  | RebindSuggestionsMessage
  | RebindAppliedMessage
  | RebindUndoneMessage
  | ExportErrorMessage
  | ProgressUpdateMessage
  | ErrorMessage
  | SettingsLoadedMessage

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
    'get-variables',
    'create-variables',
    'export-variables',
    'export-styles',
    'export-css',
    'get-style-details',
    'import-styles',
    'delete-styles',
    'rename-styles',
    'rename-variables',
    'delete-variables',
    'restore-variables',
    'move-variables',
    'duplicate-variables',
    'update-variable-values',
    'scan-rebind',
    'apply-rebind',
    'undo-rebind',
    'resize-window',
    'load-settings',
    'save-settings',
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
    'variables-list',
    'variables-created',
    'variables-renamed',
    'variables-deleted',
    'variables-restored',
    'variables-moved',
    'variables-duplicated',
    'variable-values-updated',
    'import-complete',
    'export-complete',
    'styles-export-complete',
    'css-export-complete',
    'style-details-list',
    'styles-deleted',
    'rebind-suggestions',
    'rebind-applied',
    'rebind-undone',
    'styles-renamed',
    'export-error',
    'progress-update',
    'error',
    'settings-loaded',
  ].includes(type)
}
