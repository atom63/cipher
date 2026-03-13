import { MoveHorizontal, MoveVertical } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Rainbow gradient custom handle
 */
interface RainbowHandleProps {
  vertical?: boolean;
}

export function RainbowHandle({ vertical = false }: RainbowHandleProps) {
  const style: CSSProperties = {
    backgroundImage: `linear-gradient(
      ${vertical ? "to left" : "to bottom"},
      rgba(255, 0, 0, 1) 0%,
      rgba(255, 154, 0, 1) 10%,
      rgba(208, 222, 33, 1) 20%,
      rgba(79, 220, 74, 1) 30%,
      rgba(63, 218, 216, 1) 40%,
      rgba(47, 201, 226, 1) 50%,
      rgba(28, 127, 238, 1) 60%,
      rgba(95, 21, 242, 1) 70%,
      rgba(186, 12, 248, 1) 80%,
      rgba(251, 7, 217, 1) 90%,
      rgba(255, 0, 0, 1) 100%
    )`,
    boxShadow: `0 0 0 2px rgba(148,0,211,1),
      0 0 2px 4px rgba(75,0,130,1),
      0 0 0 6px rgba(0,0,255,1),
      0 0 0 8px rgba(0,255,0,1),
      0 0 0 10px rgba(255,255,0,1),
      0 0 0 12px rgba(255,127,0,1),
      0 0 0 14px rgba(255,0,0,1)`,
    cursor: "pointer",
    height: vertical ? "0.25rem" : "100%",
    width: vertical ? "100%" : "0.25rem",
  };

  return <div style={style} />;
}

/**
 * Minimal line handle
 */
interface MinimalHandleProps {
  color?: string;
  vertical?: boolean;
  width?: string;
}

export function MinimalHandle({
  vertical = false,
  color = "white",
  width = "2px",
}: MinimalHandleProps) {
  const style: CSSProperties = {
    backgroundColor: color,
    cursor: "pointer",
    height: vertical ? width : "100%",
    width: vertical ? "100%" : width,
  };

  return <div style={style} />;
}

/**
 * Glassmorphic handle with center dot
 */
interface GlassHandleProps {
  vertical?: boolean;
}

export function GlassHandle({ vertical = false }: GlassHandleProps) {
  const containerStyle: CSSProperties = {
    alignItems: "center",
    display: "flex",
    height: "100%",
    justifyContent: "center",
    width: "100%",
  };

  const lineStyle: CSSProperties = {
    backdropFilter: "blur(10px)",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    height: vertical ? "2px" : "100%",
    position: "absolute",
    width: vertical ? "100%" : "2px",
  };

  const dotStyle: CSSProperties = {
    backdropFilter: "blur(10px)",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    border: "2px solid rgba(255, 255, 255, 0.5)",
    borderRadius: "50%",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    height: "32px",
    position: "relative",
    width: "32px",
    zIndex: 1,
  };

  return (
    <div style={containerStyle}>
      <div style={lineStyle} />
      <div style={dotStyle} />
    </div>
  );
}

/**
 * Bold colored handle
 */
interface BoldHandleProps {
  color?: string;
  vertical?: boolean;
}

export function BoldHandle({
  vertical = false,
  color = "#3b82f6",
}: BoldHandleProps) {
  const style: CSSProperties = {
    backgroundColor: color,
    boxShadow: `0 0 0 2px white, 0 0 8px ${color}`,
    cursor: "pointer",
    height: vertical ? "4px" : "100%",
    width: vertical ? "100%" : "4px",
  };

  return <div style={style} />;
}

/**
 * Simple chevron handle with glass effect
 */
interface ChevronHandleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  vertical?: boolean;
}

export function ChevronHandle({
  vertical = false,
  size = "md",
  className,
}: ChevronHandleProps) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-10",
    lg: "size-12",
  };

  const iconSizes = {
    sm: "size-4",
    md: "size-4.5",
    lg: "size-5",
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      {/* Divider Line */}
      <div
        className={cn(
          "absolute bg-white/50 dark:bg-white/30",
          vertical ? "h-0.5 w-full" : "h-full w-0.5"
        )}
      />

      {/* Glass Button */}
      <div
        className={cn(
          "relative z-10 flex cursor-pointer items-center justify-center rounded-full",
          "border border-white/40 bg-white/60 shadow shadow-black/5",
          "hover:border-white/95 hover:bg-white/60 hover:shadow-lg",
          "dark:border-white/10 dark:bg-white/5 dark:shadow-white/5 dark:hover:bg-white/10",
          "backdrop-blur-sm transition-all duration-300",
          sizeClasses[size],
          className
        )}
      >
        {vertical ? (
          <MoveVertical className={cn("shrink-0", iconSizes[size])} />
        ) : (
          <MoveHorizontal className={cn("shrink-0", iconSizes[size])} />
        )}
      </div>
    </div>
  );
}
