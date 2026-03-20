import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@/contexts/theme-context";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

export function SlideStage({
  children,
}: {
  children: ReactNode;
}) {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const recalculate = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    setScale(Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT));
  }, []);

  useEffect(() => {
    recalculate();
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(recalculate);
    observer.observe(container);
    return () => observer.disconnect();
  }, [recalculate]);

  return (
    <div className="relative flex-1 overflow-hidden" ref={containerRef}>
      <div
        className={`absolute top-1/2 left-1/2 overflow-hidden bg-background ${isDark ? "dark" : "light"}`}
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
