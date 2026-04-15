/**
 * Scrollable List Component
 * Generic horizontal scrolling container with chevron navigation
 * Can be used for tabs, buttons, or any scrollable content
 */

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

// Animation variants for chevron buttons
const chevronVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
} as const

interface ScrollableListProps {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  showChevrons?: boolean
  wrapLayoutBreakpoint?: number
}

export function ScrollableList({
  children,
  className,
  showChevrons = true,
  disabled = false,
  wrapLayoutBreakpoint,
}: ScrollableListProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [useWrapLayout, setUseWrapLayout] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const getViewport = useCallback(() => {
    return scrollAreaRef.current?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')
  }, [])

  const checkScrollPosition = useCallback(() => {
    const viewport = getViewport()
    if (!viewport) {
      return
    }

    const { scrollLeft, scrollWidth, clientWidth } = viewport
    setCanScrollLeft(scrollLeft > 1)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }, [getViewport])

  const scrollContent = useCallback(
    (direction: 'left' | 'right') => {
      const viewport = getViewport()
      if (!viewport) {
        return
      }

      const scrollAmount = viewport.clientWidth * 0.8
      const targetScroll =
        viewport.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount)

      viewport.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      })
    },
    [getViewport]
  )

  // Track container width to determine layout mode (if breakpoint provided)
  useEffect(() => {
    if (!wrapLayoutBreakpoint) {
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }

    const checkWidth = () => {
      const width = container.getBoundingClientRect().width
      setUseWrapLayout(width >= wrapLayoutBreakpoint)
    }

    checkWidth()

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(checkWidth)
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [wrapLayoutBreakpoint])

  // Check scroll state
  useEffect(() => {
    if (useWrapLayout) {
      return
    }

    const immediateCheck = window.setTimeout(checkScrollPosition, 10)
    const delayedCheck = window.setTimeout(checkScrollPosition, 100)

    return () => {
      clearTimeout(immediateCheck)
      clearTimeout(delayedCheck)
    }
  }, [checkScrollPosition, useWrapLayout, children])

  // Track scroll position
  useEffect(() => {
    if (useWrapLayout) {
      return
    }

    const viewport = getViewport()
    if (!viewport) {
      return
    }

    checkScrollPosition()

    viewport.addEventListener('scroll', checkScrollPosition)

    const resizeObserver = new ResizeObserver(checkScrollPosition)
    resizeObserver.observe(viewport)

    const contentContainer = viewport.querySelector<HTMLElement>(':scope > *')
    if (contentContainer) {
      resizeObserver.observe(contentContainer)
    }

    return () => {
      viewport.removeEventListener('scroll', checkScrollPosition)
      resizeObserver.disconnect()
    }
  }, [checkScrollPosition, getViewport, useWrapLayout])

  // If wrap layout is enabled and we're past breakpoint
  if (wrapLayoutBreakpoint && useWrapLayout) {
    return (
      <div className={className} ref={containerRef}>
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
    )
  }

  // Horizontal scroll layout
  return (
    <div className={className} ref={containerRef}>
      <div className="relative isolate">
        <ScrollArea ref={scrollAreaRef}>
          <div className="flex gap-2">{children}</div>
          <ScrollBar className="sr-only" orientation="horizontal" />
        </ScrollArea>

        {/* Left chevron */}
        {showChevrons && (
          <AnimatePresence>
            {canScrollLeft && !disabled && (
              <motion.div
                animate="visible"
                className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center"
                exit="exit"
                initial="hidden"
                variants={chevronVariants}
              >
                <Button
                  className="pointer-events-auto size-8 rounded-none text-muted-foreground hover:text-foreground bg-gradient-to-l from-transparent via-card to-card hover:bg-transparent!"
                  onClick={() => scrollContent('left')}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <ChevronLeft className="size-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Right chevron */}
        {showChevrons && (
          <AnimatePresence>
            {canScrollRight && !disabled && (
              <motion.div
                animate="visible"
                className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center justify-end"
                exit="exit"
                initial="hidden"
                variants={chevronVariants}
              >
                <Button
                  className="pointer-events-auto size-8 rounded-none text-muted-foreground hover:text-foreground bg-gradient-to-r from-transparent via-card to-card hover:bg-transparent!"
                  onClick={() => scrollContent('right')}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
