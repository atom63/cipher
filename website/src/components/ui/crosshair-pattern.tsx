import { useId } from 'react'
import { cn } from '@/lib/utils'

interface CrosshairPatternProps extends React.SVGProps<SVGSVGElement> {
  /** Length of each crosshair arm in px */
  armLength?: number
  /** Grid cell size in px */
  cellSize?: number
  className?: string
}

/**
 * Decorative crosshair grid — small + marks at regular intervals.
 * Renders as a full-size SVG with a repeating pattern.
 */
export function CrosshairPattern({
  cellSize = 48,
  armLength = 4,
  className,
  ...props
}: CrosshairPatternProps) {
  const id = useId()
  const center = cellSize / 2

  return (
    <svg
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
      {...props}
    >
      <defs>
        <pattern height={cellSize} id={id} patternUnits="userSpaceOnUse" width={cellSize}>
          {/* Crosshair horizontal arm */}
          <line
            stroke="currentColor"
            strokeWidth="1"
            x1={center - armLength}
            x2={center + armLength}
            y1={center}
            y2={center}
          />
          {/* Crosshair vertical arm (brighter, overlaps the line) */}
          <line
            stroke="currentColor"
            strokeWidth="1"
            x1={center}
            x2={center}
            y1={center - armLength}
            y2={center + armLength}
          />
        </pattern>
      </defs>
      <rect fill={`url(#${id})`} height="100%" width="100%" />
    </svg>
  )
}
