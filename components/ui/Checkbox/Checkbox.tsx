import type React from 'react'
import { Check } from 'lucide-react'
import styles from './Checkbox.module.css'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  checked?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * Primitive Checkbox Input Component
 * Custom styled checkbox with lucide-react Check icon
 * Maintains full accessibility with hidden native input
 */
export function Checkbox({ 
  id, 
  checked = false, 
  onChange,
  disabled = false,
  className = '',
  ...props
}: CheckboxProps) {
  return (
    <div className={`${styles.checkboxWrapper} ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={styles.checkboxInput}
        {...props}
      />
      <div className={`${styles.checkboxBox} ${checked ? styles.checked : ''} ${disabled ? styles.disabled : ''}`}>
        {checked && (
          <Check size={12} strokeWidth={3} className={styles.checkIcon} />
        )}
      </div>
    </div>
  )
}
