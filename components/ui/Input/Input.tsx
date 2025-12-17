import type React from 'react'
import styles from './Input.module.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: string
  error?: string
}

export function Input({ label, description, error, id, className = '', ...props }: InputProps) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={styles.wrapper}>
      <label htmlFor={inputId}>
        <span className={styles.label}>{label}</span>
        {description && <span className={styles.description}>{description}</span>}
      </label>
      <input
        id={inputId}
        className={`${styles.input} ${className}`}
        {...props}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}

