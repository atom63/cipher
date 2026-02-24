import { Children, cloneElement, isValidElement, type ReactNode, type CSSProperties } from 'react'
import styles from './Animation.module.css'

// ============================================================================
// FADE IN
// ============================================================================

export interface FadeInProps {
  children: ReactNode
  /** Animation delay in ms */
  delay?: number
  /** Animation duration in ms */
  duration?: number
  /** Direction to fade from */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  className?: string
}

export function FadeIn({
  children,
  delay = 0,
  duration = 300,
  direction = 'up',
  className = '',
}: FadeInProps) {
  const style: CSSProperties = {
    animationDelay: `${delay}ms`,
    animationDuration: `${duration}ms`,
  }

  return (
    <div
      className={`${styles.fadeIn} ${styles[`fadeIn-${direction}`]} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

// ============================================================================
// STAGGERED LIST
// ============================================================================

export interface StaggeredListProps {
  children: ReactNode
  /** Delay between each item in ms */
  staggerDelay?: number
  /** Base delay before first item in ms */
  baseDelay?: number
  /** Animation duration for each item in ms */
  duration?: number
  /** Direction to animate from */
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
}

/**
 * Wraps children with staggered fade-in animations
 * Each child appears with an incremental delay
 */
export function StaggeredList({
  children,
  staggerDelay = 50,
  baseDelay = 0,
  duration = 300,
  direction = 'up',
  className = '',
}: StaggeredListProps) {
  const childArray = Children.toArray(children)

  return (
    <div className={className}>
      {childArray.map((child, index) => {
        if (!isValidElement(child)) return child

        const delay = baseDelay + index * staggerDelay

        return (
          <FadeIn
            key={child.key ?? index}
            delay={delay}
            duration={duration}
            direction={direction}
          >
            {child}
          </FadeIn>
        )
      })}
    </div>
  )
}

// ============================================================================
// SCALE IN
// ============================================================================

export interface ScaleInProps {
  children: ReactNode
  /** Animation delay in ms */
  delay?: number
  /** Animation duration in ms */
  duration?: number
  /** Initial scale (0-1) */
  initialScale?: number
  className?: string
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 200,
  initialScale = 0.95,
  className = '',
}: ScaleInProps) {
  const style: CSSProperties = {
    animationDelay: `${delay}ms`,
    animationDuration: `${duration}ms`,
    '--initial-scale': initialScale,
  } as CSSProperties

  return (
    <div className={`${styles.scaleIn} ${className}`} style={style}>
      {children}
    </div>
  )
}

// ============================================================================
// SLIDE IN
// ============================================================================

export interface SlideInProps {
  children: ReactNode
  /** Direction to slide from */
  direction: 'left' | 'right' | 'top' | 'bottom'
  /** Animation delay in ms */
  delay?: number
  /** Animation duration in ms */
  duration?: number
  /** Slide distance in pixels */
  distance?: number
  className?: string
}

export function SlideIn({
  children,
  direction,
  delay = 0,
  duration = 300,
  distance = 20,
  className = '',
}: SlideInProps) {
  const style: CSSProperties = {
    animationDelay: `${delay}ms`,
    animationDuration: `${duration}ms`,
    '--slide-distance': `${distance}px`,
  } as CSSProperties

  return (
    <div
      className={`${styles.slideIn} ${styles[`slideIn-${direction}`]} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

// ============================================================================
// PULSE
// ============================================================================

export interface PulseProps {
  children: ReactNode
  /** Whether to animate */
  active?: boolean
  className?: string
}

export function Pulse({ children, active = true, className = '' }: PulseProps) {
  if (!active) return <>{children}</>

  return <div className={`${styles.pulse} ${className}`}>{children}</div>
}
