import { cn } from "@/lib/utils";

interface VerticalLinesProps {
  /** Number of columns (vertical lines = columns + 1) */
  columns?: number;
  className?: string;
}

/**
 * Decorative vertical guide lines that fill their container.
 * Place inside a positioned parent to constrain to a specific width.
 */
export function VerticalLines({
  columns = 4,
  className,
}: VerticalLinesProps) {
  const lines = columns + 1;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none flex h-full justify-between",
        className,
      )}
    >
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="h-full w-px bg-current"
        />
      ))}
    </div>
  );
}
