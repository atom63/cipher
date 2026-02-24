/**
 * Cipher - Figma Design System Plugin
 * Types barrel export
 */

// Token types
export type {
  ColorValue,
  ConflictInfo,
  DesignToken,
  ImportResults,
  ParsedTokens,
  ParseError,
  ShadowValue,
  SimpleTokens,
  TokenAction,
  TokenCategory,
  TokenType,
  TokenValue,
  TypographyValue,
} from './tokens'

// Message types
export type {
  // UI → Main messages
  CloseMessage,
  CreateVariablesMessage,
  ExportStylesMessage,
  ExportVariablesMessage,
  GetCollectionsMessage,
  GetStylesMessage,
  ImportStylesMessage,
  ParseTokensMessage,
  ResizeWindowMessage,
  UIToMainMessage,
  UIToMainMessageType,
  // Main → UI messages
  CollectionsListMessage,
  ErrorMessage,
  ExportCompleteMessage,
  ExportErrorMessage,
  ImportCompleteMessage,
  MainToUIMessage,
  MainToUIMessageType,
  ProgressUpdateMessage,
  StylesExportCompleteMessage,
  StylesListMessage,
  TokensParsedMessage,
  VariablesCreatedMessage,
  // Utilities
  MessageDataType,
  PluginMessage,
  PluginMessageType,
  // Data types
  CollectionInfo,
  SelectedStyleGroup,
  StyleCounts,
  StyleGroup,
  StylesByCategory,
} from './messages'

// Type guards
export { isMainToUIMessage, isUIToMainMessage } from './messages'
