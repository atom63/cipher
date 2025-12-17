import type { ReactNode, HTMLAttributes } from 'react'
import styles from './Card.module.css'

export interface CardProps {
  children: ReactNode
  variant?: 'default' | 'muted' | 'bordered' | 'elevated' | 'outline'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  className?: string
  onClick?: () => void
  asChild?: boolean
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  onClick,
}: CardProps) {
  const variantClass = styles[variant]
  const paddingClass = styles[`padding-${padding}`]
  const hoverClass = hover ? styles.hover : ''
  const clickableClass = onClick ? styles.clickable : ''

  return (
    <div
      className={`${styles.card} ${variantClass} ${paddingClass} ${hoverClass} ${clickableClass} ${className}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          onClick()
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}

// Subcomponents for better composition (shadcn-style)
export function CardHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${styles.cardHeader} ${className}`} {...props} />
}

export function CardTitle({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`${styles.cardTitle} ${className}`} {...props} />
}

export function CardDescription({ className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`${styles.cardDescription} ${className}`} {...props} />
}

export function CardContent({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${styles.cardContent} ${className}`} {...props} />
}

export function CardFooter({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${styles.cardFooter} ${className}`} {...props} />
}

