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
  secondary: "text-foreground/50",
  muted: "text-muted-foreground",
  accent: "text-primary",
  inherit: "",
};

/** Hero text — for single impactful words/numbers. Extralight, massive. */
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
    sm: "text-6xl",
    md: "text-8xl",
    lg: "text-[128px]",
  };
  return (
    <p
      className={`break-words font-extralight leading-[0.85] tracking-[-0.04em] ${sizeClasses[size]} ${textAlignClasses[align]} ${textColorClasses[color]}`}
    >
      {children}
    </p>
  );
}

/** Large headline — for section openers. Bold, tight leading. */
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

/** Slide title — for slide headings. Semibold, readable. */
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
      className={`break-words font-semibold text-5xl leading-tight tracking-[-0.02em] ${textAlignClasses[align]} ${textColorClasses[color]}`}
    >
      {children}
    </h2>
  );
}

/** Subtitle — secondary headings. Medium weight. */
export function Subtitle({
  children,
  align = "left",
  color = "muted",
}: {
  children: ReactNode;
  align?: TextAlign;
  color?: TextColor;
}) {
  return (
    <h3
      className={`break-words font-medium text-3xl leading-snug tracking-[-0.01em] ${textAlignClasses[align]} ${textColorClasses[color]}`}
    >
      {children}
    </h3>
  );
}

/** Body text — for paragraphs. Relaxed leading for readability. */
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
    sm: "text-2xl",
    md: "text-[28px]",
    lg: "text-[32px]",
  };
  return (
    <p
      className={`break-words leading-relaxed ${sizeClasses[size]} ${textAlignClasses[align]} ${textColorClasses[color]}`}
    >
      {children}
    </p>
  );
}

/** Small label — uppercase, tracked, monospace. For categories and overlines. */
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
      className={`font-medium font-mono text-lg uppercase tracking-[0.15em] ${textAlignClasses[align]} ${textColorClasses[color]}`}
    >
      {children}
    </span>
  );
}

/** Inline accent — highlighted text within body. */
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

/** Monospace text — for code, numbers, technical content. */
export function Mono({
  children,
  size = "md",
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };
  return <span className={`font-mono ${sizeClasses[size]}`}>{children}</span>;
}

/** Quote — italic blockquote with decorative mark and attribution. */
export function Quote({
  children,
  attribution,
}: {
  children: ReactNode;
  attribution?: string;
}) {
  return (
    <blockquote className="relative max-w-[1000px] break-words">
      <span
        aria-hidden="true"
        className="absolute -top-16 -left-10 text-[240px] text-primary/6 leading-none select-none"
      >
        &ldquo;
      </span>
      <p className="relative text-[40px] text-foreground/60 italic leading-[1.4]">
        {children}
      </p>
      {attribution && (
        <footer className="mt-10 font-mono text-lg text-muted-foreground/40 uppercase tracking-[0.15em]">
          — {attribution}
        </footer>
      )}
    </blockquote>
  );
}
