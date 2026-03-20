import type { ReactNode } from "react";

type TextAlign = "left" | "center" | "right";
type TextColor = "default" | "secondary" | "muted" | "accent" | "inherit";

const textAlignClasses: Record<TextAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const textColorClasses: Record<TextColor, string> = {
  default: "text-foreground",
  secondary: "text-foreground/70",
  muted: "text-muted-foreground",
  accent: "text-primary",
  inherit: "",
};

/** Hero text — massive, light weight. For single impactful words or numbers. */
export function Display({
  children,
  align = "left",
  color = "default",
  size = "lg",
}: {
  children: ReactNode;
  align?: TextAlign;
  color?: TextColor;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "text-7xl",
    md: "text-[96px]",
    lg: "text-[120px]",
  };
  return (
    <p
      className={`break-words font-light leading-[0.9] tracking-[-0.04em] ${sizeClasses[size]} ${textAlignClasses[align]} ${textColorClasses[color]}`}
    >
      {children}
    </p>
  );
}

/** Large headline — for section openers. Bold, tight. */
export function Headline({
  children,
  align = "left",
  color = "default",
}: {
  children: ReactNode;
  align?: TextAlign;
  color?: TextColor;
}) {
  return (
    <h1
      className={`break-words font-bold text-7xl leading-[0.95] tracking-[-0.03em] ${textAlignClasses[align]} ${textColorClasses[color]}`}
    >
      {children}
    </h1>
  );
}

/** Slide title — primary heading per slide. */
export function Title({
  children,
  align = "left",
  color = "default",
}: {
  children: ReactNode;
  align?: TextAlign;
  color?: TextColor;
}) {
  return (
    <h2
      className={`break-words font-semibold text-[44px] leading-[1.1] tracking-[-0.02em] ${textAlignClasses[align]} ${textColorClasses[color]}`}
    >
      {children}
    </h2>
  );
}

/** Subtitle — secondary heading. */
export function Subtitle({
  children,
  align = "left",
  color = "default",
}: {
  children: ReactNode;
  align?: TextAlign;
  color?: TextColor;
}) {
  return (
    <h3
      className={`break-words font-semibold text-[32px] leading-snug tracking-[-0.01em] ${textAlignClasses[align]} ${textColorClasses[color]}`}
    >
      {children}
    </h3>
  );
}

/** Body text — paragraphs. Legible from the back of the room. */
export function Body({
  children,
  align = "left",
  color = "secondary",
  size = "md",
}: {
  children: ReactNode;
  align?: TextAlign;
  color?: TextColor;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "text-[22px]",
    md: "text-[26px]",
    lg: "text-[30px]",
  };
  return (
    <p
      className={`break-words leading-[1.5] ${sizeClasses[size]} ${textAlignClasses[align]} ${textColorClasses[color]}`}
    >
      {children}
    </p>
  );
}

/** Label — uppercase monospace overline. Scaled for presentation. */
export function Label({
  children,
  align = "left",
  color = "muted",
}: {
  children: ReactNode;
  align?: TextAlign;
  color?: TextColor;
}) {
  return (
    <span
      className={`font-medium font-mono text-xl uppercase tracking-[0.12em] ${textAlignClasses[align]} ${textColorClasses[color]}`}
    >
      {children}
    </span>
  );
}

/** Inline accent — bold highlight within body text. */
export function Accent({
  children,
  color = "accent",
}: {
  children: ReactNode;
  color?: "accent" | "default";
}) {
  return (
    <span
      className={`font-semibold ${color === "accent" ? "text-primary" : "text-foreground"}`}
    >
      {children}
    </span>
  );
}

/** Monospace text — code, numbers, technical content. */
export function Mono({
  children,
  size = "md",
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = { sm: "text-xl", md: "text-2xl", lg: "text-4xl" };
  return <span className={`font-mono ${sizeClasses[size]}`}>{children}</span>;
}

/** Quote — large italic with decorative mark and attribution. */
export function Quote({
  children,
  attribution,
}: {
  children: ReactNode;
  attribution?: string;
}) {
  return (
    <blockquote className="relative max-w-[1100px] break-words">
      <span
        aria-hidden="true"
        className="absolute -top-20 -left-12 text-[280px] text-primary/10 leading-none select-none"
      >
        &ldquo;
      </span>
      <p className="relative text-[38px] text-foreground/80 italic leading-[1.45]">
        {children}
      </p>
      {attribution && (
        <footer className="mt-10 font-mono text-xl text-muted-foreground/50 uppercase tracking-[0.12em]">
          — {attribution}
        </footer>
      )}
    </blockquote>
  );
}
