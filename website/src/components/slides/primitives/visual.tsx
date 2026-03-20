import type { ReactNode } from "react";

type GapSize = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const gapClasses: Record<GapSize, string> = {
  none: "gap-0",
  xs: "gap-2",
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-10",
  xl: "gap-16",
  "2xl": "gap-24",
};

type BoxVariant = "default" | "muted" | "outline" | "accent";

/** Container with background, border, and padding variants. */
export function Box({
  children,
  variant = "default",
  padding = "md",
  rounded = true,
  className = "",
}: {
  children: ReactNode;
  variant?: BoxVariant;
  padding?: "none" | "sm" | "md" | "lg";
  rounded?: boolean;
  className?: string;
}) {
  const variantClasses: Record<BoxVariant, string> = {
    default: "bg-card",
    muted: "bg-muted/40 backdrop-blur-sm",
    outline: "border border-border/60",
    accent: "bg-primary/8 border border-primary/15",
  };
  const paddingClasses = { none: "p-0", sm: "p-4", md: "p-6", lg: "p-10" };

  return (
    <div
      className={`${variantClasses[variant]} ${paddingClasses[padding]} ${rounded ? "rounded-xl" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/** Horizontal or vertical rule. Accent variant uses a gradient. */
export function Divider({
  direction = "horizontal",
  color = "muted",
}: {
  direction?: "horizontal" | "vertical";
  color?: "muted" | "accent";
}) {
  if (direction === "vertical") {
    const cls = color === "accent" ? "bg-primary/30" : "bg-muted-foreground/15";
    return <div className={`h-full w-px ${cls}`} />;
  }
  if (color === "accent") {
    return (
      <div className="h-[2px] w-full rounded-full bg-linear-to-r from-primary/40 via-primary/15 to-transparent" />
    );
  }
  return <div className="h-px w-full bg-muted-foreground/10" />;
}

/** Small pill label — for tags, categories, status. */
export function Badge({
  children,
  variant = "muted",
}: {
  children: ReactNode;
  variant?: "muted" | "accent" | "outline";
}) {
  const variantClasses = {
    muted: "bg-muted/60 text-muted-foreground",
    accent: "border border-primary/20 bg-primary/6 text-primary",
    outline: "border border-border/50 text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-5 py-2 font-medium text-lg ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}

/** Background highlight block — for emphasis or callout areas. */
export function Highlight({
  children,
  variant = "accent",
}: {
  children: ReactNode;
  variant?: "accent" | "muted";
}) {
  const cls = variant === "accent" ? "bg-primary/5 border-primary/15" : "bg-muted/30 border-border/50";
  return <div className={`rounded-xl border p-8 ${cls}`}>{children}</div>;
}

/** Styled list with custom markers. */
export function List({
  children,
  marker = "dash",
  gap = "md",
}: {
  children: ReactNode;
  marker?: "dash" | "number" | "bullet" | "none";
  gap?: GapSize;
}) {
  const markerClasses = {
    dash: '[&_li]:before:content-["—"] [&_li]:before:text-muted-foreground/25 [&_li]:before:mr-4',
    number:
      "[counter-reset:item] [&_li]:before:content-[counter(item)] [&_li]:[counter-increment:item] [&_li]:before:text-primary/40 [&_li]:before:mr-4 [&_li]:before:font-mono [&_li]:before:text-base [&_li]:before:font-medium",
    bullet: '[&_li]:before:content-["·"] [&_li]:before:text-primary/60 [&_li]:before:mr-4 [&_li]:before:text-2xl',
    none: "",
  };
  return (
    <ul
      className={`flex flex-col ${gapClasses[gap]} ${markerClasses[marker]} [&_li]:flex [&_li]:items-baseline`}
    >
      {children}
    </ul>
  );
}

/** List item — use inside List. */
export function Item({ children }: { children: ReactNode }) {
  return (
    <li className="text-[26px] text-foreground/50 leading-relaxed">{children}</li>
  );
}
