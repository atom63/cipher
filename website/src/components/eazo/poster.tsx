import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { IconComponent } from "@/components/eazo/poster-icon";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel";
import { DotPattern } from "@/components/ui/dot-pattern";
import { GridPattern } from "@/components/ui/grid-pattern";
import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * CardPoster - Replaces CardThumbnail with a styled text poster (3/4.5 ratio)
 * -------------------------------------------------------------------------- */

type BrandColor =
  | "vitality-orange"
  | "canyon-glow"
  | "amber"
  | "mint"
  | "forest"
  | "sapphire"
  | "irvonwood"
  | "espresso";

type TailwindColor =
  | "red"
  | "orange"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose"
  | "slate"
  | "zinc"
  | "stone";

type PosterColorScheme = BrandColor | TailwindColor;

const BRAND_COLORS: ReadonlySet<string> = new Set<BrandColor>([
  "vitality-orange",
  "canyon-glow",
  "amber",
  "mint",
  "forest",
  "sapphire",
  "irvonwood",
  "espresso",
]);

/**
 * Light → 100 as bg, 900 as text | Dark → 900 as bg, 100 as text
 * Gradient midpoint uses 500 at 50% opacity
 */
function getPosterColorStyle(
  colorScheme: PosterColorScheme
): React.CSSProperties {
  const prefix = BRAND_COLORS.has(colorScheme)
    ? `--color-accent-brand-${colorScheme}`
    : `--color-${colorScheme}`;
  return {
    "--poster-100": `var(${prefix}-100)`,
    "--poster-500": `var(${prefix}-500)`,
    "--poster-900": `var(${prefix}-900)`,
  } as React.CSSProperties;
}

const POSTER_SOLID =
  "bg-(--poster-100) [color:var(--poster-900)] dark:bg-(--poster-900) dark:[color:var(--poster-100)]";

const POSTER_GRADIENT =
  "bg-gradient-to-b from-(--poster-100)/50 to-(--poster-500)/50 [color:var(--poster-900)] dark:from-(--poster-900)/10 dark:to-(--poster-500)/50 dark:[color:var(--poster-100)]";

interface PosterPage {
  description?: string;
  label?: string;
  layout?: PosterLayout;
  title: string;
}

type PosterPattern = "dots" | "grid" | "none";

type PosterLayout = "default" | "centered" | "top" | "editorial" | "minimal";

type PosterElement = "label" | "title" | "description" | "icon";

interface LayoutConfig {
  content: PosterElement[];
  contentAlign: "top" | "center" | "bottom";
  /** Absolute placement classes for decorative icon (single-page posters) */
  decorativeIcon: { placement: string; size: string };
  footer: PosterElement[];
  header: PosterElement[];
  /** Inline icon size (carousel pages) */
  iconSize: string;
  textAlign: "left" | "center";
}

const LAYOUT_PRESETS: Record<PosterLayout, LayoutConfig> = {
  default: {
    contentAlign: "bottom",
    textAlign: "left",
    header: ["label", "icon"],
    content: [],
    footer: ["title", "description"],
    iconSize: "size-10",
    decorativeIcon: {
      placement: "right-0 top-0 translate-x-1/4 -translate-y-1/4",
      size: "size-32",
    },
  },
  centered: {
    contentAlign: "center",
    textAlign: "center",
    header: [],
    content: ["icon", "title", "description"],
    footer: ["label"],
    iconSize: "size-10",
    decorativeIcon: {
      placement: "left-1/2 top-4 -translate-x-1/2 ",
      size: "size-24",
    },
  },
  top: {
    contentAlign: "top",
    textAlign: "left",
    header: ["label"],
    content: [],
    footer: ["title", "description", "icon"],
    iconSize: "size-10",
    decorativeIcon: {
      placement: "left-0 bottom-0 -translate-x-1/4 translate-y-1/4",
      size: "size-56",
    },
  },
  editorial: {
    contentAlign: "bottom",
    textAlign: "left",
    header: [],
    content: ["label", "description"],
    footer: ["icon", "title"],
    iconSize: "size-10",
    decorativeIcon: {
      placement: "right-0 top-0  translate-x-1/6",
      size: "size-56",
    },
  },
  minimal: {
    contentAlign: "center",
    textAlign: "left",
    header: [],
    content: ["icon", "title"],
    footer: [],
    iconSize: "size-10",
    decorativeIcon: {
      placement: "right-0 bottom-0 translate-x-1/4 translate-y-1/4",
      size: "size-36",
    },
  },
};

type PosterPaddingSize = "xs" | "sm" | "md" | "lg";
type ResponsivePosterPadding =
  | PosterPaddingSize
  | { base?: PosterPaddingSize; sm?: PosterPaddingSize };

const POSTER_CONTENT_PADDING: {
  base: Record<PosterPaddingSize, string>;
  sm: Record<PosterPaddingSize, string>;
} = {
  base: {
    xs: "gap-1 p-3",
    sm: "gap-1.5 p-4",
    md: "gap-2 p-5",
    lg: "gap-3 p-6",
  },
  sm: {
    xs: "sm:gap-1 sm:p-3",
    sm: "sm:gap-1.5 sm:p-4",
    md: "sm:gap-2 sm:p-5",
    lg: "sm:gap-3 sm:p-6",
  },
};

const POSTER_NAV_PADDING: {
  base: Record<PosterPaddingSize, string>;
  sm: Record<PosterPaddingSize, string>;
} = {
  base: {
    xs: "px-3 pb-3",
    sm: "px-4 pb-4",
    md: "px-5 pb-5",
    lg: "px-6 pb-6",
  },
  sm: {
    xs: "sm:px-3 sm:pb-3",
    sm: "sm:px-4 sm:pb-4",
    md: "sm:px-5 sm:pb-5",
    lg: "sm:px-6 sm:pb-6",
  },
};

function resolvePosterPadding(
  padding: ResponsivePosterPadding,
  map: {
    base: Record<PosterPaddingSize, string>;
    sm: Record<PosterPaddingSize, string>;
  } = POSTER_CONTENT_PADDING
): string {
  if (typeof padding === "string") {
    return map.base[padding];
  }
  const classes: string[] = [];
  if (padding.base) {
    classes.push(map.base[padding.base]);
  }
  if (padding.sm) {
    classes.push(map.sm[padding.sm]);
  }
  return classes.join(" ");
}

interface CardPosterProps extends React.ComponentProps<"div"> {
  /** Brand color scheme */
  colorScheme?: PosterColorScheme;
  /** Description text */
  description?: string;
  /** Use gradient background instead of solid */
  gradient?: boolean;
  /** Decorative icon rendered behind the text */
  icon?: IconComponent;
  /** Small eyebrow label above the title */
  label?: string;
  /** Layout preset controlling zone placement */
  layout?: PosterLayout;
  /** Padding inside poster — string or responsive { base, sm } */
  padding?: ResponsivePosterPadding;
  /** Multiple pages rendered as a swipeable carousel */
  pages?: PosterPage[];
  /** Background pattern overlay */
  pattern?: PosterPattern;
  /** Title text */
  title: string;
}

const noIconOrLabel = (el: PosterElement) => el !== "icon" && el !== "label";

function PosterPageContent({
  icon: Icon,
  page,
  paddingClass,
}: {
  icon?: IconComponent;
  paddingClass: string;
  page: PosterPage;
}) {
  const pageLayout = page.layout ?? "default";
  const config = LAYOUT_PRESETS[pageLayout];
  const data: PosterData = {
    title: page.title,
    description: page.description,
    label: page.label,
    layout: pageLayout,
  };

  return (
    <div className={cn("flex h-full flex-col", paddingClass)}>
      {(Icon || page.label) && (
        <div className="flex flex-none items-center gap-1.5">
          {Icon && (
            <Icon className="size-4 text-(--poster-500)" weight="BoldDuotone" />
          )}
          {page.label && (
            <span className="type-caption-1 sm:type-subhead font-medium uppercase tracking-wider opacity-60">
              {page.label}
            </span>
          )}
        </div>
      )}
      <PosterZone
        config={config}
        data={data}
        elements={config.header.filter(noIconOrLabel)}
        zone="header"
      />
      <PosterZone
        config={config}
        data={data}
        elements={config.content.filter(noIconOrLabel)}
        zone="content"
      />
      <PosterZone
        config={config}
        data={data}
        elements={config.footer.filter(noIconOrLabel)}
        zone="footer"
      />
    </div>
  );
}

function PosterArrows() {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } =
    useCarousel();

  const arrowClass =
    "flex size-6 items-center justify-center rounded-full bg-current/10 transition-opacity hover:bg-current/20 disabled:opacity-30 disabled:hover:bg-current/10";

  return (
    <div className="flex gap-1">
      <button
        aria-label="Previous page"
        className={arrowClass}
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        type="button"
      >
        <ChevronLeft className="size-3.5" />
      </button>
      <button
        aria-label="Next page"
        className={arrowClass}
        disabled={!canScrollNext}
        onClick={scrollNext}
        type="button"
      >
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}

function PosterDots({ count }: { count: number }) {
  const { api } = useCarousel();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const dots: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    dots.push(
      <button
        aria-label={`Go to page ${i + 1}`}
        className={cn(
          "size-1.5 rounded-full bg-current transition-opacity",
          i === current ? "opacity-100" : "opacity-30"
        )}
        key={`dot-${i}`}
        onClick={() => api?.scrollTo(i)}
        type="button"
      />
    );
  }

  return <div className="flex items-center justify-center gap-1.5">{dots}</div>;
}

function PatternLayer({ pattern }: { pattern: PosterPattern }) {
  if (pattern === "dots") {
    return <DotPattern className="text-current/20 opacity-40" />;
  }
  if (pattern === "grid") {
    return (
      <GridPattern className="fill-current/20 stroke-current/20 opacity-40" />
    );
  }
  return null;
}

const CONTENT_ALIGN_CLASSES: Record<LayoutConfig["contentAlign"], string> = {
  top: "justify-start",
  center: "justify-center",
  bottom: "justify-end",
};

interface PosterData {
  description?: string;
  icon?: IconComponent;
  label?: string;
  layout: PosterLayout;
  title: string;
}

function renderElement(
  element: PosterElement,
  data: PosterData,
  config: LayoutConfig
) {
  const centered = config.textAlign === "center";

  switch (element) {
    case "label":
      if (!data.label) {
        return null;
      }
      return (
        <span
          className={cn(
            "type-caption-1 sm:type-subhead font-medium uppercase tracking-wider opacity-60",
            centered && "text-center"
          )}
          key="label"
        >
          {data.label}
        </span>
      );
    case "title":
      return (
        <span
          className={cn(
            data.layout === "editorial"
              ? "type-title-headline sm:type-title-3 font-bold leading-tight"
              : "type-callout sm:type-headline font-bold",
            data.layout === "minimal" && "type-title-1 font-bold leading-tight",
            centered && "text-center"
          )}
          key="title"
        >
          {data.title}
        </span>
      );
    case "description":
      if (!data.description) {
        return null;
      }
      return (
        <span
          className={cn(
            "type-footnote sm:type-body line-clamp-3 leading-5 opacity-70",
            centered && "text-center"
          )}
          key="description"
        >
          {data.description}
        </span>
      );
    case "icon": {
      const Icon = data.icon;
      if (!Icon) {
        return null;
      }
      return (
        <div aria-hidden="true" key="icon">
          <Icon
            className={cn(config.iconSize, "text-(--poster-500) opacity-20")}
            weight="BoldDuotone"
          />
        </div>
      );
    }
    default:
      return null;
  }
}

function PosterZone({
  elements,
  data,
  config,
  zone,
}: {
  config: LayoutConfig;
  data: PosterData;
  elements: PosterElement[];
  zone: "header" | "content" | "footer";
}) {
  const rendered = elements
    .map((el) => renderElement(el, data, config))
    .filter(Boolean);

  if (zone === "content") {
    // Content zone is always flex-1 to fill the middle space.
    // When empty + "top" align, skip it so everything flows naturally from top.
    if (rendered.length === 0 && config.contentAlign === "top") {
      return null;
    }
    return (
      <div
        className={cn(
          "flex flex-1 flex-col gap-2",
          CONTENT_ALIGN_CLASSES[config.contentAlign]
        )}
      >
        {rendered}
      </div>
    );
  }

  if (rendered.length === 0) {
    return null;
  }

  return <div className="flex flex-none flex-col gap-2">{rendered}</div>;
}

function DecorativeIcon({
  config,
  icon: Icon,
}: {
  config: LayoutConfig;
  icon?: IconComponent;
}) {
  if (!Icon) {
    return null;
  }
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-0",
        config.decorativeIcon.placement
      )}
    >
      <Icon
        className={cn(
          config.decorativeIcon.size,
          "text-(--poster-500) opacity-20"
        )}
        weight="BoldDuotone"
      />
    </div>
  );
}

function CardPoster({
  title,
  description,
  label,
  icon,
  layout = "default",
  padding = "md",
  pages,
  pattern = "none",
  colorScheme = "mint",
  gradient = false,
  className,
  ...props
}: CardPosterProps) {
  const colorClasses = gradient ? POSTER_GRADIENT : POSTER_SOLID;
  const colorStyle = getPosterColorStyle(colorScheme);
  const paddingClass = resolvePosterPadding(padding);
  const navPaddingClass = resolvePosterPadding(padding, POSTER_NAV_PADDING);

  const hasCarousel = pages && pages.length >= 2;

  if (hasCarousel) {
    return (
      <div
        className={cn(
          "relative aspect-3/4.5 w-full overflow-hidden rounded-xl",
          colorClasses,
          className
        )}
        data-slot="card-poster"
        style={colorStyle}
        {...props}
      >
        <PatternLayer pattern={pattern} />
        <Carousel
          className="relative z-10 flex h-full flex-col [&>[data-slot=carousel-content]]:flex-1"
          opts={{ watchDrag: false }}
        >
          <CarouselContent className="ml-0 h-full">
            {pages.map((page, i) => (
              <CarouselItem className="pl-0" key={page.title}>
                <PosterPageContent
                  icon={i === 0 ? icon : undefined}
                  paddingClass={paddingClass}
                  page={page}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div
            className={cn(
              "flex flex-row items-center justify-between gap-1",
              navPaddingClass
            )}
          >
            <PosterDots count={pages.length} />
            <PosterArrows />
          </div>
        </Carousel>
      </div>
    );
  }

  const config = LAYOUT_PRESETS[layout];
  const data: PosterData = { title, description, label, layout };
  const noIcon = (el: PosterElement) => el !== "icon";

  return (
    <div
      className={cn(
        "relative flex aspect-3/4.5 w-full flex-col overflow-hidden rounded-xl",
        colorClasses,
        className
      )}
      data-slot="card-poster"
      style={colorStyle}
      {...props}
    >
      <PatternLayer pattern={pattern} />
      <DecorativeIcon config={config} icon={icon} />
      <div className={cn("relative z-10 flex flex-1 flex-col", paddingClass)}>
        <PosterZone
          config={config}
          data={data}
          elements={config.header.filter(noIcon)}
          zone="header"
        />
        <PosterZone
          config={config}
          data={data}
          elements={config.content.filter(noIcon)}
          zone="content"
        />
        <PosterZone
          config={config}
          data={data}
          elements={config.footer.filter(noIcon)}
          zone="footer"
        />
      </div>
    </div>
  );
}

export {
  CardPoster,
  getPosterColorStyle,
  POSTER_GRADIENT,
  POSTER_SOLID,
  type PosterColorScheme,
  type PosterLayout,
  type PosterPage,
  type PosterPattern,
  type ResponsivePosterPadding,
};
