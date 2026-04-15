import type React from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
  description?: string
  icon?: React.ReactNode
  title?: string
}

export function EmptyState({
  action,
  children,
  className,
  description,
  icon,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-14 text-center',
        className
      )}
    >
      {icon && (
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground [&>svg]:size-5">
          {icon}
        </div>
      )}
      {title && <h3 className="text-balance font-medium text-sm text-foreground">{title}</h3>}
      {description && (
        <p className="max-w-xs text-pretty text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
      {children}
    </div>
  )
}
