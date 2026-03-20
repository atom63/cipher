import { memo, type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DESIGN_HEIGHT, DESIGN_WIDTH, showOnlySlide, stripHeavyElements } from "./slide-utils";

// ---------------------------------------------------------------------------
// Thumbnail
// ---------------------------------------------------------------------------

const OverviewThumbnail = memo(
  ({
    slideIndex,
    isCurrent,
    sourceRef,
    scale,
    onSelect,
  }: {
    slideIndex: number;
    isCurrent: boolean;
    sourceRef: RefObject<HTMLDivElement | null>;
    scale: number;
    onSelect: (index: number) => void;
  }) => {
    const cloneRef = useRef<HTMLDivElement>(null);
    const hasCloned = useRef(false);

    // Stagger cloning: defer by slideIndex * 16ms to avoid queueing all at once
    useEffect(() => {
      if (hasCloned.current) return;
      const source = sourceRef.current;
      const container = cloneRef.current;
      if (!(source && container)) return;

      const timer = setTimeout(() => {
        requestIdleCallback(() => {
          if (hasCloned.current) return;
          const clone = source.cloneNode(true) as HTMLElement;
          showOnlySlide(clone, slideIndex);
          stripHeavyElements(clone);
          container.replaceChildren(clone);
          hasCloned.current = true;
        });
      }, slideIndex * 16);

      return () => clearTimeout(timer);
    }, [slideIndex, sourceRef]);

    return (
      <button
        aria-label={`Go to slide ${slideIndex + 1}`}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-lg border-2 outline-none transition-colors duration-150",
          "focus-visible:ring-2 focus-visible:ring-white/40",
          isCurrent
            ? "border-white/60 ring-2 ring-white/15"
            : "border-transparent hover:border-white/20",
        )}
        onClick={() => onSelect(slideIndex)}
        style={{ aspectRatio: "16 / 9" }}
        type="button"
      >
        <div
          className="pointer-events-none relative origin-top-left bg-background"
          style={{
            width: DESIGN_WIDTH,
            height: DESIGN_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          <div className="absolute inset-0" ref={cloneRef} />
        </div>

        <span
          className={cn(
            "absolute right-2 bottom-2 z-10 rounded-md px-2 py-0.5 font-mono text-xs tabular-nums",
            isCurrent
              ? "bg-white/90 text-black"
              : "bg-black/60 text-white/60",
          )}
        >
          {slideIndex + 1}
        </span>
      </button>
    );
  },
);

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

interface SlideOverviewProps {
  currentSlide: number;
  slideCount: number;
  sourceRef: RefObject<HTMLDivElement | null>;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export function SlideOverview({
  currentSlide,
  slideCount,
  sourceRef,
  onSelect,
  onClose,
}: SlideOverviewProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  // Stable combined handler — select + close
  const handleSelect = useCallback(
    (index: number) => {
      onSelect(index);
      onClose();
    },
    [onSelect, onClose],
  );

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const measure = () => {
      const firstCell = grid.firstElementChild as HTMLElement | null;
      if (firstCell) {
        const cellWidth = firstCell.clientWidth;
        if (cellWidth > 0) setScale(cellWidth / DESIGN_WIDTH);
      }
    };

    requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [slideCount]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-30 overflow-y-auto bg-black/95"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-auto max-w-6xl px-8 py-12">
        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          ref={gridRef}
        >
          {Array.from({ length: slideCount }, (_, i) => (
            <OverviewThumbnail
              isCurrent={i === currentSlide}
              key={i}
              onSelect={handleSelect}
              scale={scale}
              slideIndex={i}
              sourceRef={sourceRef}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
