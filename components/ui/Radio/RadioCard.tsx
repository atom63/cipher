import type React from 'react'
import { Radio } from './Radio'
import styles from './RadioCard.module.css'

interface RadioCardProps {
  id: string
  name: string
  value: string
  checked?: boolean
  onChange: (value: string) => void
  title: string
  description?: string
  badge?: string // For "Free", "$5.00", etc.
  icon?: React.ReactNode // Optional icon to display before title
  disabled?: boolean
}

export function RadioCard({ 
  id, 
  name, 
  value, 
  checked = false, 
  onChange, 
  title,
  description,
  badge,
  icon,
  disabled = false
}: RadioCardProps) {
  return (
    <label 
      htmlFor={id} 
      className={`${styles['card']} ${checked ? styles['checked'] : ''} ${disabled ? styles['disabled'] : ''} ${description ? styles['has-description'] : ''}`}
    >
      <Radio
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={description ? styles['radio-align'] : ''}
      />
      <div className={styles['content']}>
        <div className={styles['header']}>
          {icon && <span className={styles['icon']}>{icon}</span>}
          <span className={styles['title']}>{title}</span>
          {badge && <span className={styles['badge']}>{badge}</span>}
        </div>
        {description && <span className={styles['description']}>{description}</span>}
      </div>
    </label>
  )
}

