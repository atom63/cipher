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
  font = "sans",
  italic = false,
}: {
  children: ReactNode;
  align?: TextAlign;
  color?: TextColor;
  size?: "sm" | "md" | "lg";
  font?: "sans" | "serif";
  italic?: boolean;
}) {
  const sizeClasses = {
    sm: "text-7xl",
    md: "text-[96px]",
    lg: "text-[120px]",
  };
  const fontClasses = {
    sans: "font-light tracking-[-0.04em]",
    serif: "font-serif font-normal tracking-[-0.02em]",
  };
  return (
    <p
      className={`text-balance break-words leading-[0.9] ${fontClasses[font]} ${italic ? "italic" : ""} ${sizeClasses[size]} ${textAlignClasses[align]} ${textColorClasses[color]}`}
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
      className={`text-balance break-words font-bold text-7xl leading-[0.95] tracking-[-0.03em] ${textAlignClasses[align]} ${textColorClasses[color]}`}
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
      className={`text-balance break-words font-semibold font-serif text-[44px] leading-[1.1] tracking-[-0.02em] ${textAlignClasses[align]} ${textColorClasses[color]}`}
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
      className={`text-balance break-words font-semibold text-[32px] leading-snug tracking-[-0.01em] ${textAlignClasses[align]} ${textColorClasses[color]}`}
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
      className={`text-balance break-words leading-[1.5] ${sizeClasses[size]} ${textAlignClasses[align]} ${textColorClasses[color]}`}
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

/** Quote — cinematic pull-quote with bold accent line and serif type. */
export function Quote({
  children,
  attribution,
}: {
  children: ReactNode;
  attribution?: string;
}) {
  return (
    <blockquote className="relative max-w-[1100px] break-words text-center">
      {/* Accent bar above quote */}
      <div className="mx-auto mb-10 h-[3px] w-16 rounded-full bg-primary/40" />

      <p className="relative font-serif text-balance text-[42px] text-foreground/90 italic leading-[1.4]">
        &ldquo;{children}&rdquo;
      </p>

      {attribution && (
        <footer className="mt-12 flex items-center justify-center gap-4">
          <span className="h-px w-8 bg-foreground/15" />
          <span className="font-mono text-lg text-muted-foreground/60 uppercase tracking-[0.15em]">
            {attribution}
          </span>
          <span className="h-px w-8 bg-foreground/15" />
        </footer>
      )}
    </blockquote>
  );
}
