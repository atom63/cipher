import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import styles from './Dialog.module.css'

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'lg',
  className = '',
}: DialogProps) {
  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.dialog} ${styles[`maxWidth-${maxWidth}`]} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader title={title} onClose={onClose} />
        <div className={styles.content}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}

interface DialogHeaderProps {
  title: string
  onClose: () => void
}

function DialogHeader({ title, onClose }: DialogHeaderProps) {
  return (
    <div className={styles.header}>
      <h3>{title}</h3>
      <button
        className={styles.closeButton}
        onClick={onClose}
        type="button"
        aria-label="Close dialog"
      >
        <X size={20} />
      </button>
    </div>
  )
}

export interface DialogActionsProps {
  children: ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
}

export function DialogActions({ children, align = 'right', className = '' }: DialogActionsProps) {
  return (
    <div className={`${styles.actions} ${styles[`align-${align}`]} ${className}`}>{children}</div>
  )
}

