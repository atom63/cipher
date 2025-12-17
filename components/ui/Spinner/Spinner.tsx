import type { ReactNode } from 'react'
import styles from './Spinner.module.css'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return <div className={`${styles.spinner} ${styles[size]} ${className}`} />
}

export interface LoadingStateProps {
  message?: string
  hint?: string
  children?: ReactNode
}

export function LoadingState({ message, hint, children }: LoadingStateProps) {
  return (
    <div className={styles.loadingState}>
      {children || <Spinner size="lg" />}
      {message && <p className={styles.message}>{message}</p>}
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  )
}

