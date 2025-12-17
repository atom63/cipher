import type React from 'react'
import styles from './Textarea.module.css'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  description?: string
  error?: string
}

export function Textarea({ label, description, error, id, className = '', ...props }: TextareaProps) {
  const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={textareaId}>
          <span className={styles.label}>{label}</span>
          {description && <span className={styles.description}>{description}</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`${styles.textarea} ${className}`}
        {...props}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}

