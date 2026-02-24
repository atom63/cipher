import type { ReactNode } from 'react'
import styles from './Spinner.module.css'

// ============================================================================
// SPINNER
// ============================================================================

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`${styles.spinner} ${styles[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

// ============================================================================
// LOADING STATE
// ============================================================================

export interface LoadingStateProps {
  message?: string
  hint?: string
  size?: 'sm' | 'md' | 'lg'
  children?: ReactNode
}

export function LoadingState({
  message,
  hint,
  size = 'md',
  children,
}: LoadingStateProps) {
  return (
    <div className={styles.loadingState}>
      {children || <Spinner size={size} />}
      {message && <p className={styles.message}>{message}</p>}
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  )
}

// ============================================================================
// LOADING OVERLAY
// ============================================================================

export interface LoadingOverlayProps {
  message?: string
  visible?: boolean
}

/**
 * Overlay that covers parent element with loading indicator
 * Parent must have position: relative
 */
export function LoadingOverlay({ message, visible = true }: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <div className={styles.overlay}>
      <LoadingState message={message} size="md" />
    </div>
  )
}

// ============================================================================
// INLINE LOADING
// ============================================================================

export interface InlineLoadingProps {
  message?: string
  className?: string
}

/**
 * Inline loading indicator for use within text or buttons
 */
export function InlineLoading({ message, className = '' }: InlineLoadingProps) {
  return (
    <span className={`${styles.inline} ${className}`}>
      <Spinner size="sm" />
      {message && <span>{message}</span>}
    </span>
  )
}

// ============================================================================
// PROGRESS INDICATOR
// ============================================================================

export interface ProgressProps {
  /** Progress value 0-100 */
  value: number
  /** Show percentage text */
  showText?: boolean
  /** Custom label */
  label?: string
  className?: string
}

/**
 * Progress bar with optional percentage display
 */
export function Progress({
  value,
  showText = true,
  label,
  className = '',
}: ProgressProps) {
  const clampedValue = Math.max(0, Math.min(100, value))

  return (
    <div className={`${styles.progress} ${className}`}>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showText && (
        <span className={styles.progressText}>
          {label || `${Math.round(clampedValue)}%`}
        </span>
      )}
    </div>
  )
}
