/**
 * Design Token Type Definitions
 */

export type TokenValue = string | number | { modes: Record<string, string> }

export type DesignToken = {
  value?: TokenValue
  type: string
  collection: string
  modes?: Record<string, string>
  description?: string
}

export type TokenCollection = Record<string, unknown>

export type DesignTokens = {
  $schema: string
  $version: string
  $collections: Record<
    string,
    { name: string; description: string; order: number; modes: string[] }
  >
  tokens: {
    primitives: TokenCollection
    abstractions: TokenCollection
    semantics: TokenCollection
  }
}
