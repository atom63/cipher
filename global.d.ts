/**
 * Cipher - Figma Design System Plugin
 * Author: You Zhang (ATOM63)
 * Global TypeScript declarations
 */

/// <reference types="@figma/plugin-typings" />

declare const __html__: string

// Figma plugin UI globals
declare const parent: {
  postMessage: (message: { pluginMessage: any }, origin: string) => void
}

declare const window: Window & typeof globalThis
declare const document: Document

// CSS Modules
declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '*.module.scss' {
  const classes: { [key: string]: string }
  export default classes
}
