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
