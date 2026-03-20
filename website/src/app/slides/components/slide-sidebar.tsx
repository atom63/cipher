import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { memo, type RefObject, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DESIGN_HEIGHT, DESIGN_WIDTH, showOnlySlide, stripHeavyElements } from "./slide-utils";
import type { SlideInfo } from "./use-slides-dom";

const SlideThumbnail = memo(
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

    useEffect(() => {
      if (hasCloned.current) return;
      const source = sourceRef.current;
      const container = cloneRef.current;
      if (!(source && container)) return;

      const id = requestIdleCallback(() => {
        const clone = source.cloneNode(true) as HTMLElement;
        showOnlySlide(clone, slideIndex);
        stripHeavyElements(clone);
        container.replaceChildren(clone);
        hasCloned.current = true;
      });

      return () => cancelIdleCallback(id);
    }, [slideIndex, sourceRef]);

    return (
      <button
        aria-label={`Go to slide ${slideIndex + 1}`}
        className={cn(
          "group relative w-full cursor-pointer overflow-hidden rounded-md border outline-none transition-colors duration-150",
          "focus-visible:ring-2 focus-visible:ring-white/40",
          isCurrent
            ? "border-white/50 ring-1 ring-white/20"
            : "border-white/10 hover:border-white/25",
        )}
        onClick={() => onSelect(slideIndex)}
        style={{ aspectRatio: "16 / 9", contentVisibility: "auto" }}
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

        <span className="absolute right-1.5 bottom-1 z-10 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white/50 tabular-nums">
          {slideIndex + 1}
        </span>
      </button>
    );
  },
);

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function useSidebarScale(
  containerRef: RefObject<HTMLDivElement | null>,
  isOpen: boolean,
) {
  const [scale, setScale] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const availableWidth = el.clientWidth - 24;
      if (availableWidth > 0) setScale(availableWidth / DESIGN_WIDTH);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, isOpen]);

  return scale;
}

function useGroupedSlides(slideInfos: SlideInfo[]) {
  const [groups, setGroups] = useState<
    { section: string | null; slides: SlideInfo[] }[]
  >([]);

  useEffect(() => {
    const result: { section: string | null; slides: SlideInfo[] }[] = [];
    for (const info of slideInfos) {
      const last = result[result.length - 1];
      if (last && last.section === info.section) {
        last.slides.push(info);
      } else {
        result.push({ section: info.section, slides: [info] });
      }
    }
    setGroups(result);
  }, [slideInfos]);

  return groups;
}

interface SlideSidebarProps {
  currentSlide: number;
  slideInfos: SlideInfo[];
  sourceRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (index: number) => void;
}

export function SlideSidebar({
  currentSlide,
  slideInfos,
  sourceRef,
  isOpen,
  onToggle,
  onSelect,
}: SlideSidebarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scale = useSidebarScale(containerRef, isOpen);
  const currentRef = useRef<HTMLDivElement>(null);
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (isOpen && !hasOpened) setHasOpened(true);
  }, [isOpen, hasOpened]);

  useEffect(() => {
    if (!isOpen) return;
    currentRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [currentSlide, isOpen]);

  const groups = useGroupedSlides(slideInfos);

  return (
    <>
      {/* Toggle */}
      <button
        aria-label={isOpen ? "Close slide navigator" : "Open slide navigator"}
        className={cn(
          "absolute top-3 left-3 z-20 rounded-md p-1.5 outline-none transition-colors duration-150",
          "text-white/30 hover:bg-white/10 hover:text-white/60",
          "focus-visible:ring-2 focus-visible:ring-white/40",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        type="button"
      >
        {isOpen ? (
          <PanelLeftClose className="size-4" />
        ) : (
          <PanelLeftOpen className="size-4" />
        )}
      </button>

      {/* Panel */}
      <div
        aria-hidden={!isOpen}
        className={cn(
          "absolute top-0 left-0 z-10 flex h-full w-52 flex-col",
          "border-white/5 border-r bg-black/95 backdrop-blur-md",
          "transition-[transform,opacity] duration-300 ease-out",
          isOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0 pointer-events-none",
        )}
        onClick={(e) => e.stopPropagation()}
        ref={containerRef}
      >
        {/* Custom scrollbar styling for dark sidebar */}
        <div className="flex-1 overflow-y-auto px-3 pt-12 pb-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
          {hasOpened &&
            groups.map((group, gi) => (
              <div key={gi} className="mb-4">
                {group.section && (
                  <div className="mb-2 px-0.5 font-mono text-white/20 text-[10px] uppercase tracking-[0.15em]">
                    {group.section}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {group.slides.map((info) => (
                    <div
                      key={info.index}
                      ref={
                        info.index === currentSlide ? currentRef : undefined
                      }
                    >
                      <SlideThumbnail
                        isCurrent={info.index === currentSlide}
                        onSelect={onSelect}
                        scale={scale}
                        slideIndex={info.index}
                        sourceRef={sourceRef}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
