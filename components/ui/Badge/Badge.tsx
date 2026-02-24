import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import styles from './Badge.module.css'

export interface BadgeProps {
  children: ReactNode
  /** Color variant */
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'outline'
  /** Size */
  size?: 'sm' | 'md' | 'lg'
  /** Pill shape (fully rounded) */
  pill?: boolean
  /** Show dot indicator */
  dot?: boolean
  /** Dot color (defaults to variant color) */
  dotColor?: string
  /** Make badge removable */
  removable?: boolean
  /** Called when remove button clicked */
  onRemove?: () => void
  /** Icon before text */
  icon?: ReactNode
  className?: string
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  pill = false,
  dot = false,
  dotColor,
  removable = false,
  onRemove,
  icon,
  className = '',
}: BadgeProps) {
  const variantClass = styles[variant]
  const pillClass = pill ? styles.pill : ''

  return (
    <span
      className={`${styles.badge} ${variantClass} ${styles[size]} ${pillClass} ${className}`}
    >
      {dot && (
        <span
          className={styles.dot}
          style={dotColor ? { backgroundColor: dotColor } : undefined}
        />
      )}
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.text}>{children}</span>
      {removable && (
        <button
          type="button"
          className={styles.removeButton}
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          aria-label="Remove"
        >
          <X size={12} />
        </button>
      )}
    </span>
  )
}

// ============================================================================
// STATUS BADGE - Preset for common status indicators
// ============================================================================

export type StatusType = 'online' | 'offline' | 'busy' | 'away' | 'pending' | 'active' | 'inactive'

const statusConfig: Record<StatusType, { variant: BadgeProps['variant']; label: string }> = {
  online: { variant: 'success', label: 'Online' },
  offline: { variant: 'secondary', label: 'Offline' },
  busy: { variant: 'destructive', label: 'Busy' },
  away: { variant: 'warning', label: 'Away' },
  pending: { variant: 'warning', label: 'Pending' },
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'secondary', label: 'Inactive' },
}

export function StatusBadge({
  status,
  showDot = true,
  className = '',
}: {
  status: StatusType
  showDot?: boolean
  className?: string
}) {
  const config = statusConfig[status]
  return (
    <Badge
      variant={config.variant}
      dot={showDot}
      size="sm"
      pill
      className={className}
    >
      {config.label}
    </Badge>
  )
}

// ============================================================================
// COUNT BADGE - For notification counts
// ============================================================================

export function CountBadge({
  count,
  max = 99,
  variant = 'destructive',
  className = '',
}: {
  count: number
  max?: number
  variant?: BadgeProps['variant']
  className?: string
}) {
  const displayCount = count > max ? `${max}+` : String(count)

  if (count <= 0) return null

  return (
    <Badge variant={variant} size="sm" pill className={`${styles.countBadge} ${className}`}>
      {displayCount}
    </Badge>
  )
}
