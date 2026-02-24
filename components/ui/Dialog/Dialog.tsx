import { useEffect, useCallback, type ReactNode } from 'react'
import { X } from 'lucide-react'
import styles from './Dialog.module.css'

export interface DialogProps {
  /** Whether dialog is open */
  isOpen: boolean
  /** Called when dialog should close */
  onClose: () => void
  /** Dialog title */
  title: string
  /** Dialog content */
  children: ReactNode
  /** Footer content (usually actions) */
  footer?: ReactNode
  /** Max width variant */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Visual variant for special dialogs */
  variant?: 'default' | 'danger' | 'success'
  /** Close on overlay click (default: true) */
  closeOnOverlayClick?: boolean
  /** Close on Escape key (default: true) */
  closeOnEscape?: boolean
  /** Show close button (default: true) */
  showCloseButton?: boolean
  className?: string
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
  variant = 'default',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
}: DialogProps) {
  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose()
      }
    },
    [closeOnEscape, onClose]
  )

  // Add/remove escape listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose()
    }
  }

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        className={`${styles.dialog} ${styles[`maxWidth-${maxWidth}`]} ${className}`}
        onClick={(e) => e.stopPropagation()}
        data-variant={variant !== 'default' ? variant : undefined}
      >
        <div className={styles.header}>
          <h3 id="dialog-title">{title}</h3>
          {showCloseButton && (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div className={styles.content}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}

// ============================================================================
// DIALOG ACTIONS
// ============================================================================

export interface DialogActionsProps {
  children: ReactNode
  align?: 'left' | 'center' | 'right' | 'between'
  className?: string
}

export function DialogActions({
  children,
  align = 'right',
  className = '',
}: DialogActionsProps) {
  return (
    <div className={`${styles.actions} ${styles[`align-${align}`]} ${className}`}>
      {children}
    </div>
  )
}

// ============================================================================
// CONFIRM DIALOG - Preset for confirmations
// ============================================================================

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant={variant}
      maxWidth="sm"
      footer={
        <DialogActions>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: variant === 'danger' ? 'var(--destructive)' : 'var(--primary)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Loading...' : confirmText}
          </button>
        </DialogActions>
      }
    >
      <p style={{ margin: 0, color: 'var(--muted-foreground)' }}>{message}</p>
    </Dialog>
  )
}
