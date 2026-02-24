import type React from 'react'
import { forwardRef } from 'react'
import { Check, Minus } from 'lucide-react'
import styles from './Checkbox.module.css'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Unique identifier */
  id: string
  /** Checked state */
  checked?: boolean
  /** Indeterminate state (for parent checkboxes) */
  indeterminate?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Error state */
  error?: boolean
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * Checkbox Input Component
 * Custom styled checkbox with animations and accessibility
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      id,
      checked = false,
      indeterminate = false,
      size = 'md',
      error = false,
      onChange,
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) {
    const sizeClass = size !== 'md' ? styles[size] : ''
    const iconSize = size === 'sm' ? 10 : size === 'lg' ? 16 : 12

    return (
      <div
        className={`${styles.checkboxWrapper} ${sizeClass} ${className}`}
        data-error={error || undefined}
      >
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={styles.checkboxInput}
          aria-checked={indeterminate ? 'mixed' : checked}
          {...props}
        />
        <div
          className={`
            ${styles.checkboxBox}
            ${checked ? styles.checked : ''}
            ${indeterminate ? styles.indeterminate : ''}
            ${disabled ? styles.disabled : ''}
          `}
        >
          {checked && !indeterminate && (
            <Check size={iconSize} strokeWidth={3} className={styles.checkIcon} />
          )}
          {indeterminate && <div className={styles.indeterminateIcon} />}
        </div>
      </div>
    )
  }
)
