import { memo } from "react";

export const SlideFrame = memo(function SlideFrame({
  section,
  currentSlide,
  totalSlides,
  deckTitle,
}: {
  section: string | null;
  currentSlide: number;
  totalSlides: number;
  deckTitle: string;
}) {
  const slideNum = String(currentSlide + 1).padStart(2, "0");
  const totalNum = String(totalSlides).padStart(2, "0");

  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-8">
      {/* Top-left: section */}
      <div className="absolute top-8 left-8">
        <span
          className="font-mono text-muted-foreground/40 text-xs uppercase tracking-[0.15em] transition-opacity duration-200"
          style={{ opacity: section ? 1 : 0 }}
        >
          {section ?? "\u00A0"}
        </span>
      </div>

      {/* Top-right: counter */}
      <div className="absolute top-8 right-8">
        <span className="font-mono text-muted-foreground/30 text-xs tabular-nums">
          {slideNum}
          <span className="text-muted-foreground/15"> / {totalNum}</span>
        </span>
      </div>

      {/* Bottom-left: deck title */}
      <div className="absolute bottom-8 left-8">
        <span className="font-mono text-muted-foreground/20 text-xs uppercase tracking-[0.15em]">
          {deckTitle}
        </span>
      </div>
    </div>
  );
});
