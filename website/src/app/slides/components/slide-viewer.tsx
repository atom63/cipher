import { type ComponentType, useCallback, useEffect, useRef, useState } from "react";
import { Grid2x2, Maximize, Minimize } from "lucide-react";
import { MDXProvider } from "@mdx-js/react";
import { PersonalizeToggle } from "@/components/common/theme/personalize-toggle";
import { ThemeToggle } from "@/components/common/theme/theme-toggle";
import { slideMdxComponents } from "@/components/slides/slide-mdx-components";
import { SlideFrame } from "./slide-frame";
import { SlideOverview } from "./slide-overview";
import { SlideSidebar } from "./slide-sidebar";
import { SlideStage } from "./slide-stage";
import { useFullscreen } from "./use-fullscreen";
import { useSlidesDom } from "./use-slides-dom";

const toolbarButtonClass =
  "rounded-md p-1.5 text-white/30 outline-none transition-colors duration-150 hover:bg-white/10 hover:text-white/60 focus-visible:ring-2 focus-visible:ring-white/40";

interface SlideViewerProps {
  Content: ComponentType;
  title: string;
}

export function SlideViewer({ Content, title }: SlideViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const { contentRef, slideCount, currentSection, slideInfos } =
    useSlidesDom(currentSlide);
  const { containerRef, isFullscreen, toggleFullscreen } = useFullscreen();

  const next = useCallback(
    () =>
      setCurrentSlide((s) => Math.min(s + 1, Math.max(slideCount - 1, 0))),
    [slideCount],
  );
  const prev = useCallback(
    () => setCurrentSlide((s) => Math.max(s - 1, 0)),
    [],
  );

  const handleSelect = useCallback((i: number) => setCurrentSlide(i), []);
  const handleToggleSidebar = useCallback(
    () => setSidebarOpen((v) => !v),
    [],
  );
  const handleCloseOverview = useCallback(() => setOverviewOpen(false), []);

  // Store callbacks in refs so keyboard handler doesn't re-register
  const callbacksRef = useRef({ next, prev, toggleFullscreen, sidebarOpen, isFullscreen, overviewOpen });
  callbacksRef.current = { next, prev, toggleFullscreen, sidebarOpen, isFullscreen, overviewOpen };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const { next, prev, toggleFullscreen, sidebarOpen, isFullscreen, overviewOpen } = callbacksRef.current;

      // Overview captures its own Escape
      if (overviewOpen && e.key !== "o" && e.key !== "O") return;

      if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        if (sidebarOpen) {
          setSidebarOpen(false);
        } else if (isFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else {
          window.history.back();
        }
      } else if (e.key === "s" || e.key === "S") {
        setSidebarOpen((v) => !v);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "o" || e.key === "O") {
        setOverviewOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // registered once, reads from ref

  const progress =
    slideCount > 0 ? ((currentSlide + 1) / slideCount) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-100 flex flex-col bg-black"
      onClick={(e) => {
        if (overviewOpen) return;
        const target = e.target as HTMLElement;
        if (target.closest("[data-slot='popover-content']")) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) prev();
        else next();
      }}
      ref={containerRef}
      role="application"
      aria-label={`Slide presentation: ${title}`}
    >
      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar — hidden via CSS in fullscreen to preserve state */}
        <SlideSidebar
          currentSlide={currentSlide}
          isOpen={sidebarOpen && !isFullscreen}
          onSelect={handleSelect}
          onToggle={handleToggleSidebar}
          slideInfos={slideInfos}
          sourceRef={contentRef}
        />

        <SlideStage>
          <SlideFrame
            currentSlide={currentSlide}
            deckTitle={title}
            section={currentSection}
            totalSlides={slideCount}
          />

          <div
            className="relative flex size-full flex-col px-32 py-[120px]"
            data-slide-content
            ref={contentRef}
          >
            <MDXProvider components={slideMdxComponents}>
              <Content />
            </MDXProvider>
          </div>
        </SlideStage>

        {overviewOpen && (
          <SlideOverview
            currentSlide={currentSlide}
            onClose={handleCloseOverview}
            onSelect={handleSelect}
            slideCount={slideCount}
            sourceRef={contentRef}
          />
        )}

        {/* Fullscreen: floating toolbar, auto-hides */}
        {isFullscreen && (
          <div
            className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center pb-4 opacity-0 transition-opacity duration-300 hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/80 px-2 py-1.5 backdrop-blur-md">
              <span className="px-2 font-mono text-white/30 text-xs tabular-nums">
                {currentSlide + 1}/{slideCount}
              </span>
              <div className="mx-1 h-4 w-px bg-white/10" />
              <button
                aria-label="Slide overview"
                className={toolbarButtonClass}
                onClick={() => setOverviewOpen((v) => !v)}
                type="button"
              >
                <Grid2x2 className="size-3.5" />
              </button>
              <button
                aria-label="Exit fullscreen"
                className={toolbarButtonClass}
                onClick={toggleFullscreen}
                type="button"
              >
                <Minimize className="size-3.5" />
              </button>
              <PersonalizeToggle size="icon-xs" className={toolbarButtonClass} popoverClassName="z-[200]" popoverContainer={containerRef.current} />
              <ThemeToggle size="icon-xs" className={toolbarButtonClass} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar — windowed mode only */}
      {!isFullscreen && (
        <div
          className="flex shrink-0 items-center gap-4 bg-black px-4 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="w-16 font-mono text-white/30 text-xs tabular-nums">
            {currentSlide + 1} / {slideCount}
          </span>

          <div className="h-0.5 flex-1 rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-white/25 transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-0.5">
            <button
              aria-label="Slide overview"
              className={toolbarButtonClass}
              onClick={() => setOverviewOpen((v) => !v)}
              type="button"
            >
              <Grid2x2 className="size-3.5" />
            </button>
            <button
              aria-label="Enter fullscreen"
              className={toolbarButtonClass}
              onClick={toggleFullscreen}
              type="button"
            >
              <Maximize className="size-3.5" />
            </button>
            <PersonalizeToggle size="icon-xs" className={toolbarButtonClass} popoverClassName="z-[200]" />
            <ThemeToggle size="icon-xs" className={toolbarButtonClass} />
          </div>
        </div>
      )}
    </div>
  );
}
