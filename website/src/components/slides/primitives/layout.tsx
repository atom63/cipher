import type { CSSProperties, ReactNode } from "react";

type GapSize = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type AlignOption = "start" | "center" | "end" | "stretch" | "baseline";
type JustifyOption =
  | "start"
  | "center"
  | "end"
  | "between"
  | "around"
  | "evenly";

const gapClasses: Record<GapSize, string> = {
  none: "gap-0",
  xs: "gap-2",
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-10",
  xl: "gap-16",
  "2xl": "gap-24",
};

const alignClasses: Record<AlignOption, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyClasses: Record<JustifyOption, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

export function Columns({
  children,
  count = 2,
  gap = "lg",
  align = "stretch",
}: {
  children: ReactNode;
  count?: 2 | 3 | 4;
  gap?: GapSize;
  align?: AlignOption;
}) {
  const colClasses = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };
  return (
    <div
      className={`grid min-h-0 flex-1 ${colClasses[count]} ${gapClasses[gap]} ${alignClasses[align]} *:min-h-0`}
    >
      {children}
    </div>
  );
}

export function Stack({
  children,
  gap = "md",
  align = "stretch",
  justify = "start",
  className = "",
}: {
  children: ReactNode;
  gap?: GapSize;
  align?: AlignOption;
  justify?: JustifyOption;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col ${gapClasses[gap]} ${alignClasses[align]} ${justifyClasses[justify]} ${className}`}
    >
      {children}
    </div>
  );
}

export function Row({
  children,
  gap = "md",
  align = "center",
  justify = "start",
  wrap = false,
}: {
  children: ReactNode;
  gap?: GapSize;
  align?: AlignOption;
  justify?: JustifyOption;
  wrap?: boolean;
}) {
  return (
    <div
      className={`flex ${wrap ? "flex-wrap" : ""} ${gapClasses[gap]} ${alignClasses[align]} ${justifyClasses[justify]}`}
    >
      {children}
    </div>
  );
}

export function Center({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center">{children}</div>
  );
}

export function Spacer({ size = "lg" }: { size?: GapSize }) {
  const sizeClasses: Record<GapSize, string> = {
    none: "h-0",
    xs: "h-2",
    sm: "h-4",
    md: "h-6",
    lg: "h-10",
    xl: "h-16",
    "2xl": "h-24",
  };
  return <div className={sizeClasses[size]} />;
}

export function Bleed({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-32 -my-[120px] flex size-full items-center justify-center">
      {children}
    </div>
  );
}

export function Fill() {
  return <div className="flex-1" />;
}

export function Position({
  children,
  top,
  right,
  bottom,
  left,
}: {
  children: ReactNode;
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
}) {
  const style: CSSProperties = { position: "absolute", top, right, bottom, left };
  return <div style={style}>{children}</div>;
}

// =============================================================================
// SLIDE BACKGROUND — decorative gradient layers behind content
// =============================================================================

type BgVariant = "glow" | "corner" | "gradient" | "mesh";
type BgPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

const positionStyles: Record<BgPosition, CSSProperties> = {
  center: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
  "top-left": { top: "-20%", left: "-20%" },
  "top-right": { top: "-20%", right: "-20%" },
  "bottom-left": { bottom: "-20%", left: "-20%" },
  "bottom-right": { bottom: "-20%", right: "-20%" },
};

/** Decorative gradient background layer. Renders behind slide content. */
export function SlideBackground({
  variant = "glow",
  position = "center",
  opacity = 0.12,
  size = "lg",
}: {
  variant?: BgVariant;
  position?: BgPosition;
  opacity?: number;
  /** Size of the gradient area */
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClasses = {
    sm: "size-[400px]",
    md: "size-[600px]",
    lg: "size-[900px]",
    xl: "size-[1200px]",
  };

  if (variant === "mesh") {
    return (
      <div className="pointer-events-none absolute inset-0 -mx-32 -my-[120px] z-0 overflow-hidden">
        <div
          className={`absolute rounded-full ${sizeClasses[size]}`}
          style={{
            ...positionStyles["top-right"],
            opacity: opacity * 0.8,
            background: "radial-gradient(circle, var(--primary) 0%, transparent 65%)",
          }}
        />
        <div
          className={`absolute rounded-full ${sizeClasses[size]}`}
          style={{
            ...positionStyles["bottom-left"],
            opacity: opacity * 0.5,
            background: "radial-gradient(circle, var(--primary) 0%, transparent 65%)",
          }}
        />
      </div>
    );
  }

  if (variant === "gradient") {
    return (
      <div
        className="pointer-events-none absolute inset-0 -mx-32 -my-[120px] -z-10"
        style={{
          opacity,
          background: "linear-gradient(135deg, var(--primary) 0%, transparent 60%)",
        }}
      />
    );
  }

  if (variant === "corner") {
    return (
      <div className="pointer-events-none absolute inset-0 -mx-32 -my-[120px] z-0 overflow-hidden">
        <div
          className={`absolute rounded-full ${sizeClasses[size]}`}
          style={{
            ...positionStyles[position === "center" ? "bottom-right" : position],
            opacity,
            background: "radial-gradient(circle, var(--primary) 0%, transparent 65%)",
          }}
        />
      </div>
    );
  }

  // Default: glow — centered radial
  return (
    <div className="pointer-events-none absolute inset-0 -mx-32 -my-[120px] z-0 overflow-hidden">
      <div
        className={`absolute rounded-full ${sizeClasses[size]}`}
        style={{
          ...positionStyles[position],
          opacity,
          background: "radial-gradient(circle, var(--primary) 0%, transparent 65%)",
        }}
      />
    </div>
  );
}
