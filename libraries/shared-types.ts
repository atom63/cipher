// Shared types for Figma plugin backend
// These types are used across multiple modules

/// <reference types="@figma/plugin-typings" />

export interface ColorValue {
  r: number
  g: number
  b: number
  a?: number
}

export interface DesignToken {
  id: string
  name: string
  figmaName: string
  value: ColorValue | number | string | any
  originalValue: string
  type: string
  category: string
  description?: string
  action: string
  modeName?: string
}

export interface ParseError {
  token?: string
  message: string
  severity: 'error' | 'warning'
}

export interface ParsedTokens {
  tokens: DesignToken[]
  stats: {
    total: number
    byCategory: Record<string, number>
    conflicts: number
    errors: number
  }
  errors: ParseError[]
}

export interface ImportResults {
  success: number
  failed: number
  errors: string[]
  skipped: number
  changes: Array<{
    name: string
    type: string
    action: 'created' | 'updated' | 'unchanged'
    oldValue?: string
    newValue: string
  }>
}

