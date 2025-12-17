import type React from 'react'
import { Checkbox } from './Checkbox'
import styles from './CheckboxWithDescription.module.css'

interface CheckboxWithDescriptionProps {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function CheckboxWithDescription({ 
  id,
  label, 
  description, 
  checked, 
  onChange, 
  disabled = false 
}: CheckboxWithDescriptionProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.checkboxContainer}>
        <Checkbox
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-describedby={description ? `${id}-description` : undefined}
        />
      </div>
      <div className={styles.content}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {description && (
          <p id={`${id}-description`} className={styles.description}>
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

