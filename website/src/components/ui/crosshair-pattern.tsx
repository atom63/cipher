import { useId } from "react";
import { cn } from "@/lib/utils";

interface CrosshairPatternProps extends React.SVGProps<SVGSVGElement> {
  /** Grid cell size in px */
  cellSize?: number;
  /** Length of each crosshair arm in px */
  armLength?: number;
  className?: string;
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
  const id = useId();
  const center = cellSize / 2;

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 size-full",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={cellSize}
          height={cellSize}
          patternUnits="userSpaceOnUse"
        >
          {/* Crosshair horizontal arm */}
          <line
            x1={center - armLength}
            y1={center}
            x2={center + armLength}
            y2={center}
            stroke="currentColor"
            strokeWidth="1"
          />
          {/* Crosshair vertical arm (brighter, overlaps the line) */}
          <line
            x1={center}
            y1={center - armLength}
            x2={center}
            y2={center + armLength}
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
