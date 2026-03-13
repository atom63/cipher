/**
 * Motion tokens for Framer Motion.
 *
 * Mirrors the CSS duration and easing tokens from primitives.css and aliases.css
 * so that <motion.*> components stay aligned with the design system.
 *
 * CSS tokens use milliseconds; Framer Motion uses seconds — values are converted.
 */

// ---------------------------------------------------------------------------
// Duration (seconds) — mirrors --duration-* primitives
// ---------------------------------------------------------------------------

export const duration = {
  /** 0ms — --duration-none */
  none: 0,
  /** 83ms — --duration-83 */
  83: 0.083,
  /** 150ms — --duration-150 */
  150: 0.15,
  /** 167ms — --duration-167 */
  167: 0.167,
  /** 250ms — --duration-250 */
  250: 0.25,
  /** 333ms — --duration-333 */
  333: 0.333,
  /** 500ms — --duration-500 */
  500: 0.5,
  /** 667ms — --duration-667 */
  667: 0.667,
  /** 1000ms — --duration-1000 */
  1000: 1,
  /** 1500ms — --duration-1500 */
  1500: 1.5,

  // Aliases — mirrors --duration-* aliases
  /** 0ms — --duration-instant */
  instant: 0,
  /** 150ms — --duration-fast */
  fast: 0.15,
  /** 250ms — --duration-normal */
  normal: 0.25,
  /** 500ms — --duration-slow */
  slow: 0.5,
  /** 1000ms — --duration-slower */
  slower: 1,
} as const;

// ---------------------------------------------------------------------------
// Easing (cubic-bezier arrays) — mirrors --ease-* primitives
// ---------------------------------------------------------------------------

export const ease = {
  /** cubic-bezier(0, 0, 1, 1) — --ease-linear */
  linear: [0, 0, 1, 1],
  /** cubic-bezier(0, 0, 0, 1) — --ease-fast */
  fast: [0, 0, 0, 1],
  /** cubic-bezier(0.55, 0.55, 0, 1) — --ease-pointtopoint */
  pointToPoint: [0.55, 0.55, 0, 1],
  /** cubic-bezier(0.13, 1.62, 0, 0.92) — --ease-spring */
  spring: [0.13, 1.62, 0, 0.92],
  /** cubic-bezier(1, 0, 1, 1) — --ease-soft */
  soft: [1, 0, 1, 1],
  /** cubic-bezier(0.63, 0.05, 0.01, 0.99) — --ease-inout */
  inOut: [0.63, 0.05, 0.01, 0.99],
} as const;
