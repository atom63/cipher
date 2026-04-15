import {
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { cn } from '@/lib/utils'

type AnimationType = 'auto' | 'scroll' | 'bounce'
type Trigger = 'hover' | 'mount'

interface TextTickerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /**
   * How the ticker decides between scroll vs bounce.
   * - `"auto"` (default): bounces if overflow is small, scrolls if large.
   * - `"scroll"`: always scrolls in one direction then resets.
   * - `"bounce"`: always ping-pongs back and forth.
   * @default "auto"
   */
  animationType?: AnimationType
  /**
   * Pause at each end of a bounce in ms.
   * @default 0
   */
  bounceDelay?: number
  /**
   * Speed of the bounce animation in px/s.
   * Used when animationType resolves to bounce.
   * @default 50
   */
  bounceSpeed?: number
  /**
   * Single text string to display.
   */
  children: ReactNode
  /**
   * Disable scrolling entirely.
   * @default false
   */
  disabled?: boolean
  /**
   * Explicit duration for one full scroll/bounce cycle in ms.
   * Overrides bounceSpeed / scrollSpeed when set.
   */
  duration?: number
  /**
   * Whether the animation loops.
   * @default true
   */
  loop?: boolean
  /**
   * Delay before the first animation starts in ms.
   * @default 0
   */
  marqueeDelay?: number
  /**
   * Called each time the text completes a full cycle.
   */
  onMarqueeComplete?: () => void
  /**
   * Gap in px between the end and repeated start in scroll mode.
   * @default 50
   */
  repeatSpacer?: number
  /**
   * Speed of the scroll animation in px/s.
   * Used when animationType resolves to scroll.
   * @default 150
   */
  scrollSpeed?: number
  /**
   * Overflow threshold in px — text must exceed container by at least
   * this much before the animation activates.
   * @default 0
   */
  shouldAnimateThreshold?: number
  /**
   * What triggers the animation.
   * - `"hover"`: starts on mouse enter, resets on leave.
   * - `"mount"`: starts automatically when mounted.
   * @default "hover"
   */
  trigger?: Trigger
}

function TextTicker({
  animationType = 'auto',
  bounceDelay = 0,
  bounceSpeed = 50,
  children,
  className,
  disabled = false,
  duration,
  loop = true,
  marqueeDelay = 0,
  onMarqueeComplete,
  repeatSpacer = 50,
  scrollSpeed = 150,
  shouldAnimateThreshold = 0,
  trigger = 'hover',
  ...props
}: TextTickerProps) {
  const outerRef = useRef<HTMLSpanElement>(null)
  const innerRef = useRef<HTMLSpanElement>(null)
  const [overflow, setOverflow] = useState(0)
  const [active, setActive] = useState(trigger === 'mount')
  const [offset, setOffset] = useState(0)
  const rafRef = useRef<number>(0)
  const onCompleteRef = useRef(onMarqueeComplete)
  onCompleteRef.current = onMarqueeComplete

  const measure = useCallback(() => {
    const outer = outerRef.current
    if (!outer) {
      return
    }
    // When inner is display:contents, text flows directly in outer
    // so outer.scrollWidth reflects full content width
    const diff = outer.scrollWidth - outer.clientWidth
    setOverflow(diff > shouldAnimateThreshold ? diff : 0)
  }, [shouldAnimateThreshold])

  useEffect(() => {
    measure()
    const observer = new ResizeObserver(measure)
    if (outerRef.current) {
      observer.observe(outerRef.current)
    }
    return () => observer.disconnect()
  }, [measure])

  useEffect(() => {
    if (disabled || !active || overflow <= 0) {
      setOffset(0)
      return
    }

    // Resolve animation type
    const resolvedType: 'scroll' | 'bounce' =
      animationType === 'auto' ? (overflow > 80 ? 'scroll' : 'bounce') : animationType

    // Compute speed from duration or per-type speed
    const totalDistance = resolvedType === 'scroll' ? overflow + repeatSpacer : overflow
    const speed = duration
      ? totalDistance / (duration / 1000)
      : resolvedType === 'bounce'
        ? bounceSpeed
        : scrollSpeed

    const endDelay = resolvedType === 'bounce' ? bounceDelay : 0

    let direction: 'left' | 'right' = 'left'
    let current = 0
    let pauseUntil = performance.now() + marqueeDelay
    let lastTime = 0
    let loopCount = 0

    const tick = (time: number) => {
      if (lastTime === 0) {
        lastTime = time
      }

      if (time < pauseUntil) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const dt = (time - lastTime) / 1000
      lastTime = time

      if (resolvedType === 'bounce') {
        if (direction === 'left') {
          current = Math.min(current + speed * dt, overflow)
          if (current >= overflow) {
            direction = 'right'
            pauseUntil = time + endDelay
            loopCount++
            onCompleteRef.current?.()
          }
        } else {
          current = Math.max(current - speed * dt, 0)
          if (current <= 0) {
            direction = 'left'
            pauseUntil = time + endDelay
            if (!loop) {
              setOffset(0)
              return
            }
          }
        }
        setOffset(-current)
      } else {
        // scroll mode
        current += speed * dt
        if (current >= overflow + repeatSpacer) {
          current = 0
          loopCount++
          onCompleteRef.current?.()
          pauseUntil = time + marqueeDelay
          if (!loop && loopCount >= 1) {
            setOffset(0)
            return
          }
        }
        setOffset(-current)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [
    active,
    animationType,
    bounceDelay,
    bounceSpeed,
    disabled,
    duration,
    loop,
    marqueeDelay,
    overflow,
    repeatSpacer,
    scrollSpeed,
  ])

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setActive(true)
    }
  }

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setActive(false)
      setOffset(0)
    }
  }

  const isScrolling = active && overflow > 0

  return (
    <span
      className={cn(
        'block min-w-0 overflow-hidden whitespace-nowrap',
        !isScrolling && 'text-ellipsis',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={outerRef}
      {...props}
    >
      <span
        className={
          isScrolling ? 'inline-block whitespace-nowrap will-change-transform' : 'contents'
        }
        ref={innerRef}
        style={isScrolling ? { transform: `translateX(${offset}px)` } : undefined}
      >
        {children}
      </span>
    </span>
  )
}

export { TextTicker, type TextTickerProps }
