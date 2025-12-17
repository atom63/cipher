import type React from 'react'
import { Checkbox } from './Checkbox'
import styles from './CheckboxWithLabel.module.css'

interface CheckboxWithLabelProps {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function CheckboxWithLabel({ 
  id, 
  label, 
  checked, 
  onChange, 
  disabled = false 
}: CheckboxWithLabelProps) {
  return (
    <div className={styles['wrapper']}>
      <Checkbox
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <label htmlFor={id} className={styles['label']}>
        {label}
      </label>
    </div>
  )
}

