import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

export interface EmptyStateProps {
  /** Icon element to display */
  icon?: ReactNode
  /** Illustration SVG/image (alternative to icon) */
  illustration?: ReactNode
  /** Main title text */
  title?: string
  /** Description text */
  description?: string
  /** Action button/element */
  action?: ReactNode
  /** Additional content */
  children?: ReactNode
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Visual variant */
  variant?: 'default' | 'bordered' | 'compact'
  className?: string
}

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  children,
  size = 'md',
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  const variantClass = variant !== 'default' ? styles[variant] : ''

  return (
    <div
      className={`${styles.emptyState} ${variantClass} ${className}`}
      data-size={size}
    >
      {illustration && <div className={styles.illustration}>{illustration}</div>}
      {icon && !illustration && <div className={styles.icon}>{icon}</div>}
      {title && <h3 className={styles.title}>{title}</h3>}
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
      {children}
    </div>
  )
}

// ============================================================================
// PRESET EMPTY STATES
// ============================================================================

/** Empty state for no search results */
export function NoResultsState({
  query,
  onClear,
}: {
  query?: string
  onClear?: () => void
}) {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description={
        query
          ? `No matches for "${query}". Try adjusting your search.`
          : 'Try adjusting your filters or search terms.'
      }
      action={
        onClear && (
          <button type="button" onClick={onClear} className="text-primary">
            Clear search
          </button>
        )
      }
      variant="compact"
    />
  )
}

/** Empty state for no data */
export function NoDataState({
  title = 'No data yet',
  description = 'Get started by adding your first item.',
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <EmptyState
      icon="📭"
      title={title}
      description={description}
      action={action}
      variant="bordered"
    />
  )
}

/** Empty state for errors */
export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error. Please try again.',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <EmptyState
      icon="⚠️"
      title={title}
      description={description}
      action={
        onRetry && (
          <button type="button" onClick={onRetry} className="text-primary">
            Try again
          </button>
        )
      }
    />
  )
}
