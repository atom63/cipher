/**
 * Cipher - Error Handling Utilities
 * Provides consistent error handling patterns across the application
 */

// ============================================================================
// TYPES
// ============================================================================

/** Error severity levels */
export type ErrorSeverity = 'info' | 'warning' | 'error'

/** Structured error information */
export interface ErrorInfo {
  message: string
  severity: ErrorSeverity
  code?: string
  context?: string
  details?: string[]
}

/** Result type for operations that can fail */
export type Result<T, E = ErrorInfo> =
  | { ok: true; value: T }
  | { ok: false; error: E }

// ============================================================================
// ERROR CREATION
// ============================================================================

/**
 * Create a structured error info object
 */
export function createError(
  message: string,
  options: {
    severity?: ErrorSeverity
    code?: string
    context?: string
    details?: string[]
  } = {}
): ErrorInfo {
  return {
    message,
    severity: options.severity ?? 'error',
    code: options.code,
    context: options.context,
    details: options.details,
  }
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}

// ============================================================================
// SAFE EXECUTION
// ============================================================================

/**
 * Safely execute an async function and return a Result
 *
 * @example
 * ```ts
 * const result = await safeExecute(async () => {
 *   return await fetchData()
 * })
 *
 * if (result.ok) {
 *   console.log(result.value)
 * } else {
 *   showError(result.error)
 * }
 * ```
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<Result<T>> {
  try {
    const value = await fn()
    return { ok: true, value }
  } catch (error) {
    return {
      ok: false,
      error: createError(getErrorMessage(error), { context }),
    }
  }
}

/**
 * Safely execute a sync function and return a Result
 */
export function safeExecuteSync<T>(
  fn: () => T,
  context?: string
): Result<T> {
  try {
    const value = fn()
    return { ok: true, value }
  } catch (error) {
    return {
      ok: false,
      error: createError(getErrorMessage(error), { context }),
    }
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/** Validation result */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate that a value is not empty
 */
export function validateRequired(
  value: unknown,
  fieldName: string
): ValidationResult {
  const isEmpty =
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)

  if (isEmpty) {
    return { valid: false, errors: [`${fieldName} is required`] }
  }
  return { valid: true, errors: [] }
}

/**
 * Validate multiple fields at once
 */
export function validateAll(
  validations: ValidationResult[]
): ValidationResult {
  const errors = validations.flatMap((v) => v.errors)
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Create a validation error message from validation results
 */
export function formatValidationErrors(result: ValidationResult): string {
  if (result.valid) return ''
  return result.errors.join('\n')
}

// ============================================================================
// ERROR MESSAGE FORMATTING
// ============================================================================

/**
 * Format an error for display to users
 */
export function formatUserError(error: ErrorInfo): string {
  let message = error.message

  if (error.context) {
    message = `${error.context}: ${message}`
  }

  if (error.details && error.details.length > 0) {
    message += '\n\n' + error.details.join('\n')
  }

  return message
}

/**
 * Format multiple errors into a single message
 */
export function formatErrorList(errors: string[], prefix = ''): string {
  if (errors.length === 0) return ''
  if (errors.length === 1) return prefix ? `${prefix}: ${errors[0]}` : errors[0]

  const header = prefix || 'The following errors occurred'
  return `${header}:\n${errors.map((e) => `• ${e}`).join('\n')}`
}

// ============================================================================
// ERROR LOGGING
// ============================================================================

/**
 * Log an error with context (for debugging)
 */
export function logError(error: unknown, context?: string): void {
  const message = getErrorMessage(error)
  const prefix = context ? `[${context}]` : ''
  console.error(`${prefix} ${message}`, error)
}

/**
 * Log a warning with context
 */
export function logWarning(message: string, context?: string): void {
  const prefix = context ? `[${context}]` : ''
  console.warn(`${prefix} ${message}`)
}
