import type { ReactNode } from "react";

type GapSize = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const gapClasses: Record<GapSize, string> = {
  none: "gap-0",
  xs: "gap-2",
  sm: "gap-4",
  md: "gap-8",
  lg: "gap-12",
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
    default: "bg-card/80",
    muted: "bg-muted/30 border border-border/30",
    outline: "border border-border/50",
    accent: "bg-primary/6 border border-primary/12",
  };
  const paddingClasses = { none: "p-0", sm: "p-5", md: "p-8", lg: "p-12" };

  return (
    <div
      className={`${variantClasses[variant]} ${paddingClasses[padding]} ${rounded ? "rounded-2xl" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/** Horizontal or vertical rule. */
export function Divider({
  direction = "horizontal",
  color = "muted",
}: {
  direction?: "horizontal" | "vertical";
  color?: "muted" | "accent";
}) {
  if (direction === "vertical") {
    const cls = color === "accent" ? "bg-primary/25" : "bg-border/40";
    return <div className={`h-full w-px ${cls}`} />;
  }
  if (color === "accent") {
    return (
      <div className="h-[3px] w-full rounded-full bg-linear-to-r from-primary/50 via-primary/20 to-transparent" />
    );
  }
  return <div className="h-px w-full bg-border/30" />;
}

/** Pill badge — scaled for presentation. */
export function Badge({
  children,
  variant = "muted",
}: {
  children: ReactNode;
  variant?: "muted" | "accent" | "outline";
}) {
  const variantClasses = {
    muted: "bg-muted/50 text-foreground/60",
    accent: "border border-primary/20 bg-primary/8 text-primary",
    outline: "border border-border/40 text-foreground/50",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-6 py-2.5 font-medium text-xl ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}

/** Background highlight block. */
export function Highlight({
  children,
  variant = "accent",
}: {
  children: ReactNode;
  variant?: "accent" | "muted";
}) {
  const cls = variant === "accent" ? "bg-primary/5 border-primary/12" : "bg-muted/20 border-border/30";
  return <div className={`rounded-2xl border p-10 ${cls}`}>{children}</div>;
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
    dash: '[&_li]:before:content-["—"] [&_li]:before:text-foreground/20 [&_li]:before:mr-5',
    number:
      "[counter-reset:item] [&_li]:before:content-[counter(item)] [&_li]:[counter-increment:item] [&_li]:before:text-primary/50 [&_li]:before:mr-5 [&_li]:before:font-mono [&_li]:before:text-lg [&_li]:before:font-semibold",
    bullet: '[&_li]:before:content-["·"] [&_li]:before:text-primary/70 [&_li]:before:mr-5 [&_li]:before:text-3xl [&_li]:before:leading-none',
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

/** List item — readable at presentation scale. */
export function Item({ children }: { children: ReactNode }) {
  return (
    <li className="text-[24px] text-foreground/60 leading-[1.5]">{children}</li>
  );
}
