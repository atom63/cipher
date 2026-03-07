import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { X, Info, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import styles from './Toast.module.css'

// ============================================================================
// TYPES
// ============================================================================

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
  action?: ToastAction
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (message: string, variant?: ToastVariant, duration?: number, action?: ToastAction) => void
  removeToast: (id: string) => void
  showError: (message: string) => void
  showSuccess: (message: string, action?: ToastAction) => void
  showWarning: (message: string) => void
  showInfo: (message: string) => void
}

// ============================================================================
// CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null)

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access toast notifications
 *
 * @example
 * ```tsx
 * const { showError, showSuccess } = useToast()
 *
 * const handleSubmit = async () => {
 *   try {
 *     await saveData()
 *     showSuccess('Data saved successfully')
 *   } catch (error) {
 *     showError('Failed to save data')
 *   }
 * }
 * ```
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// ============================================================================
// PROVIDER
// ============================================================================

const DEFAULT_DURATION = 5000 // 5 seconds

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration = DEFAULT_DURATION, action?: ToastAction) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const toast: Toast = { id, message, variant, duration, action }

      setToasts((prev) => [...prev, toast])

      // Auto-remove after duration (longer if there's an action)
      const timeout = action ? Math.max(duration, 8000) : duration
      if (timeout > 0) {
        setTimeout(() => removeToast(id), timeout)
      }
    },
    [removeToast]
  )

  const showError = useCallback(
    (message: string) => addToast(message, 'error'),
    [addToast]
  )

  const showSuccess = useCallback(
    (message: string, action?: ToastAction) => addToast(message, 'success', DEFAULT_DURATION, action),
    [addToast]
  )

  const showWarning = useCallback(
    (message: string) => addToast(message, 'warning'),
    [addToast]
  )

  const showInfo = useCallback(
    (message: string) => addToast(message, 'info'),
    [addToast]
  )

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        showError,
        showSuccess,
        showWarning,
        showInfo,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

// ============================================================================
// COMPONENTS
// ============================================================================

const icons = {
  info: <Info size={16} />,
  success: <CheckCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  error: <AlertCircle size={16} />,
}

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  return (
    <div className={`${styles.toast} ${styles[toast.variant]}`} role="alert">
      <span className={styles.icon}>{icons[toast.variant]}</span>
      <span className={styles.message}>{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => {
            toast.action?.onClick()
            onDismiss(toast.id)
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        className={styles.dismissButton}
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
