import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Button } from '../Button'
import styles from './Dropdown.module.css'

export interface DropdownOption {
  value: string
  label: string
  icon?: ReactNode
  disabled?: boolean
  danger?: boolean
  onClick?: () => void
}

export interface DropdownProps {
  trigger: ReactNode | ((isOpen: boolean) => ReactNode)
  options: DropdownOption[]
  align?: 'left' | 'right' | 'center'
  width?: 'auto' | 'trigger' | number
  disabled?: boolean
  onSelect?: (value: string) => void
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Dropdown({
  trigger,
  options,
  align = 'left',
  width = 'auto',
  disabled = false,
  onSelect,
  className = '',
  variant = 'secondary',
  size = 'md',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleSelect = (option: DropdownOption) => {
    if (!option.disabled) {
      option.onClick?.()
      onSelect?.(option.value)
      setIsOpen(false)
    }
  }

  const getMenuWidth = () => {
    if (width === 'auto') {
      return 'auto'
    }
    if (width === 'trigger' && triggerRef.current) {
      return `${triggerRef.current.offsetWidth}px`
    }
    if (typeof width === 'number') {
      return `${width}px`
    }
    return 'auto'
  }

  return (
    <div
      ref={dropdownRef}
      className={`${styles.dropdown} ${className}`}
    >
      <Button
        ref={triggerRef}
        onClick={handleToggle}
        disabled={disabled}
        variant={variant}
        size={size}
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {typeof trigger === 'function' ? trigger(isOpen) : trigger}
      </Button>

      {isOpen && (
        <div
          className={`${styles.menu} ${styles[`align-${align}`]}`}
          style={{ width: getMenuWidth() }}
          role="menu"
          aria-orientation="vertical"
        >
          <ul className={styles.menuList}>
            {options.map((option) => (
              <li key={option.value} role="none">
                <button
                  type="button"
                  role="menuitem"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option)}
                  className={`${styles.menuItem} ${
                    option.disabled ? styles.menuItemDisabled : ''
                  } ${option.danger ? styles.menuItemDanger : ''}`}
                >
                  {option.icon && (
                    <span className={styles.menuItemIcon}>{option.icon}</span>
                  )}
                  <span className={styles.menuItemLabel}>{option.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

