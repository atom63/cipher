import type { ReactNode } from 'react'
import styles from './Badge.module.css'

export interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: BadgeProps) {
  const variantClass = styles[variant]
  
  return (
    <span
      className={`${styles.badge} ${variantClass} ${styles[size]} ${className}`}
    >
      {children}
    </span>
  )
}

