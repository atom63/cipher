import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  align?: "left" | "center" | "right";
  className?: string;
  description?: string;
  descriptionClassName?: string;
  padding?: "none" | "tight" | "default" | "loose";
  title: string;
  titleClassName?: string;
  variant?: "display" | "primary" | "secondary" | "muted" | "subtle";
}

export function SectionHeader({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
  variant = "primary",
  align = "left",
  padding = "default",
}: SectionHeaderProps) {
  const paddingClasses = {
    none: "",
    tight: "py-4 sm:py-6 md:py-8",
    default: "py-8 sm:py-16 md:py-20",
    loose: "py-12 sm:py-20 md:py-28",
  };

  const variantConfig = {
    display: {
      TitleTag: "h1" as const,
      DescTag: "h5" as const,
      titleClass: "text-6xl max-w-2xl font-bold text-balance", // Uses h1 default (display-web: 80px)
      descClass: "text-3xl mt-4 max-w-xl text-balance text-muted-foreground", // Uses h5 default (lead-web: 20px)
      withPadding: true,
    },
    primary: {
      TitleTag: "h1" as const,
      DescTag: "h5" as const,
      titleClass: "font-bold", // Uses h1 default (display-web: 80px)
      descClass: "mt-2 max-w-2xl text-balance text-muted-foreground", // Uses h5 default (lead-web: 20px)
      withPadding: false,
    },
    secondary: {
      TitleTag: "h2" as const,
      DescTag: "h5" as const,
      titleClass: "font-semibold text-foreground", // Uses h2 default (title1-web: 60px)
      descClass: "mt-2 max-w-2xl text-balance text-muted-foreground", // Uses h5 default (lead-web: 20px)
      withPadding: false,
    },
    muted: {
      TitleTag: "h5" as const,
      DescTag: "p" as const,
      titleClass: "font-medium text-foreground", // Uses h5 default (lead-web: 20px)
      descClass: "mt-1 max-w-lg text-balance text-muted-foreground/80", // Uses p default (body-web: 16px)
      withPadding: false,
    },
    subtle: {
      TitleTag: "h6" as const,
      DescTag: "p" as const,
      titleClass: "font-normal text-muted-foreground", // Uses h6 default (body-web: 16px)
      descClass: "mt-1 max-w-md text-balance text-muted-foreground/70", // Uses p default (body-web: 16px)
      withPadding: false,
    },
  };

  const config = variantConfig[variant];
  const { TitleTag, DescTag, titleClass, descClass, withPadding } = config;

  const alignClasses = {
    center: "mx-auto text-center",
    right: "ml-auto text-right",
    left: "",
  };

  const content = (
    <>
      <TitleTag className={cn(titleClass, alignClasses[align], titleClassName)}>
        {title}
      </TitleTag>
      {description && (
        <DescTag
          className={cn(descClass, alignClasses[align], descriptionClassName)}
        >
          {description}
        </DescTag>
      )}
    </>
  );

  const renderContent = () =>
    withPadding ? (
      <div className={cn(paddingClasses[padding])}>{content}</div>
    ) : (
      content
    );

  return (
    <div
      className={cn(
        "",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
    >
      {renderContent()}
    </div>
  );
}
