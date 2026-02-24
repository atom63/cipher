import type React from 'react'
import { forwardRef, useState, useEffect } from 'react'
import styles from './Textarea.module.css'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label text */
  label?: string
  /** Helper description below label */
  description?: string
  /** Error message (also sets error state) */
  error?: string
  /** Success message (also sets success state) */
  success?: string
  /** Hint text below textarea */
  hint?: string
  /** Maximum character count (shows counter) */
  maxLength?: number
  /** Show character count even without maxLength */
  showCount?: boolean
  /** Resize behavior */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
  /** Full width */
  fullWidth?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      description,
      error,
      success,
      hint,
      maxLength,
      showCount = false,
      resize = 'vertical',
      fullWidth = true,
      id,
      className = '',
      disabled,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) {
    const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)
    const hasError = Boolean(error)
    const hasSuccess = Boolean(success) && !hasError
    const showHint = hint && !error && !success

    // Track character count
    const [charCount, setCharCount] = useState(0)
    const shouldShowCount = showCount || maxLength !== undefined

    useEffect(() => {
      const initialValue = value ?? defaultValue ?? ''
      setCharCount(String(initialValue).length)
    }, [value, defaultValue])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)
      onChange?.(e)
    }

    return (
      <div
        className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}
        data-disabled={disabled || undefined}
      >
        {label && (
          <label htmlFor={textareaId} className={styles.labelWrapper}>
            <span className={styles.label}>{label}</span>
            {description && <span className={styles.description}>{description}</span>}
          </label>
        )}

        <div
          className={styles.textareaWrapper}
          data-error={hasError || undefined}
          data-success={hasSuccess || undefined}
          data-disabled={disabled || undefined}
        >
          <textarea
            ref={ref}
            id={textareaId}
            className={styles.textarea}
            style={{ resize }}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            aria-invalid={hasError || undefined}
            aria-describedby={
              error ? `${textareaId}-error` : success ? `${textareaId}-success` : hint ? `${textareaId}-hint` : undefined
            }
            {...props}
          />
        </div>

        <div className={styles.footer}>
          <div className={styles.messages}>
            {error && (
              <span id={`${textareaId}-error`} className={styles.error} role="alert">
                {error}
              </span>
            )}
            {success && !error && (
              <span id={`${textareaId}-success`} className={styles.success}>
                {success}
              </span>
            )}
            {showHint && (
              <span id={`${textareaId}-hint`} className={styles.hint}>
                {hint}
              </span>
            )}
          </div>

          {shouldShowCount && (
            <span
              className={styles.charCount}
              data-over={maxLength !== undefined && charCount > maxLength ? 'true' : undefined}
            >
              {charCount}
              {maxLength !== undefined && ` / ${maxLength}`}
            </span>
          )}
        </div>
      </div>
    )
  }
)
