import type React from "react";
import { DotPattern } from "@/components/ui/dot-pattern";
import { GridPattern } from "@/components/ui/grid-pattern";
import { cn } from "@/lib/utils";
import {
  getPosterColorStyle,
  POSTER_GRADIENT,
  POSTER_SOLID,
  type PosterColorScheme,
} from "./poster";

type PatternVariant = "dots" | "grid" | "none";

interface PosterBgProps extends React.ComponentProps<"div"> {
  /** Brand color scheme */
  colorScheme?: PosterColorScheme;
  /** Enable glow animation on dot pattern */
  glow?: boolean;
  /** Use gradient background instead of solid */
  gradient?: boolean;
  /** Background pattern overlay */
  pattern?: PatternVariant;
  /** Pattern opacity (0–1) */
  patternOpacity?: number;
  /** Grid squares to highlight (only for grid pattern) */
  squares?: [x: number, y: number][];
}

function PosterBg({
  children,
  className,
  colorScheme = "mint",
  glow = false,
  gradient = false,
  pattern = "dots",
  patternOpacity = 0.4,
  squares,
  ...props
}: PosterBgProps) {
  const colorClasses = gradient ? POSTER_GRADIENT : POSTER_SOLID;
  const colorStyle = getPosterColorStyle(colorScheme);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        colorClasses,
        className
      )}
      style={colorStyle}
      {...props}
    >
      {pattern === "dots" && (
        <DotPattern
          className="text-current/20"
          glow={glow}
          style={{ opacity: patternOpacity }}
        />
      )}
      {pattern === "grid" && (
        <GridPattern
          className="fill-current/20 stroke-current/20"
          squares={squares}
          style={{ opacity: patternOpacity }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export { PosterBg, type PosterBgProps, type PatternVariant };
