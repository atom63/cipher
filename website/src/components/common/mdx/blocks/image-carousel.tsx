import { memo, useCallback, useEffect, useState } from "react";
import { mdxStyles } from "@/components/common/mdx/mdx-styles";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { MediaCaption } from "./media-caption";

/**
 * Image Carousel Block Component
 *
 * Displays multiple images in an interactive carousel/slider with navigation controls.
 * Built on top of the Image component from @/components/ui/image which provides:
 * - Lazy loading with intersection observer
 * - Skeleton loading states
 * - Optimized image decoding (async)
 * - Smooth fade-in animations (respects reduced motion)
 * - Error handling with fallbacks
 * - Multiple aspect ratios
 * - Responsive behavior
 *
 * @example
 * ```tsx
 * <ImageCarouselBlock
 *   images={[
 *     { src: "/1.jpg", alt: "First image", caption: "Caption 1" },
 *     { src: "/2.jpg", alt: "Second image" },
 *   ]}
 *   aspectRatio="16/9"
 *   showDots
 *   autoplay
 * />
 * ```
 *
 * @example Multiple slides per view
 * ```tsx
 * <ImageCarouselBlock
 *   images={imageArray}
 *   slidesPerView={3}
 *   showThumbnails
 * />
 * ```
 */

// Types
type SlidesPerView = 1 | 2 | 3 | 4;
type AspectRatio = "1/1" | "4/3" | "3/4" | "16/9" | "9/16";

// Constants
const SLIDE_BASIS_CLASSES: Record<SlidesPerView, string> = {
  1: "basis-full",
  2: "basis-1/2",
  3: "basis-1/3",
  4: "basis-1/4",
} as const;

const DEFAULT_AUTOPLAY_DELAY = 3000;

// Interfaces
export interface CarouselImage {
  alt: string;
  caption?: string;
  src: string;
}

export interface ImageCarouselBlockProps {
  aspectRatio?: AspectRatio;
  autoplay?: boolean;
  autoplayDelay?: number;
  bordered?: boolean;
  caption?: string;
  className?: string;
  cursorIndicator?: boolean;
  hideArrows?: boolean;
  images: CarouselImage[];
  showDots?: boolean;
  showThumbnails?: boolean;
  slidesPerView?: SlidesPerView;
}

// Helper Functions
const getCarouselContentGap = (slidesPerView: SlidesPerView): string => {
  if (slidesPerView > 2) {
    return "-ml-0 gap-1";
  }
  if (slidesPerView > 1) {
    return "-ml-0 gap-2";
  }
  return "";
};

const calculateTotalPages = (
  imageCount: number,
  slidesPerView: SlidesPerView
): number => Math.ceil(imageCount / slidesPerView);

const getCurrentPage = (
  current: number,
  slidesPerView: SlidesPerView
): number => Math.floor((current - 1) / slidesPerView);

// Hooks
const useCarouselApi = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap() + 1);

    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap() + 1);
    };

    api.on("select", handleSelect);

    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  return { api, setApi, current };
};

const useAutoplay = (
  api: CarouselApi | undefined,
  enabled: boolean,
  delay: number
) => {
  useEffect(() => {
    if (!(api && enabled)) {
      return;
    }

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, delay);

    return () => clearInterval(interval);
  }, [api, enabled, delay]);
};

// Main Component
const ImageCarouselBlockComponent = ({
  images,
  aspectRatio = "16/9",
  className,
  showThumbnails = false,
  showDots = false,
  autoplay = false,
  autoplayDelay = DEFAULT_AUTOPLAY_DELAY,
  caption,
  slidesPerView = 1,
  hideArrows = false,
  bordered = true,
}: ImageCarouselBlockProps) => {
  const { api, setApi, current } = useCarouselApi();

  useAutoplay(api, autoplay, autoplayDelay);

  const handlePageSelect = useCallback(
    (pageIndex: number) => {
      api?.scrollTo(pageIndex * slidesPerView);
    },
    [api, slidesPerView]
  );

  const handleThumbnailClick = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api]
  );

  // Handle empty state
  if (!images || images.length === 0) {
    return (
      <div className={cn(mdxStyles.spacing.media, className)}>
        <div className="flex aspect-video items-center justify-center rounded-lg border border-border bg-muted p-8">
          <span className="text-muted-foreground text-sm">
            No images provided for carousel
          </span>
        </div>
        {caption && <MediaCaption>{caption}</MediaCaption>}
      </div>
    );
  }

  // Single image - render as simple Image with caption
  if (images.length === 1) {
    const image = images[0];
    if (!image) {
      return null;
    }
    return (
      <figure className={cn(mdxStyles.spacing.media, className)}>
        <Image
          alt={image.alt}
          aspectRatio={aspectRatio}
          className="w-full"
          src={image.src}
        />
        {(image.caption || caption) && (
          <MediaCaption>{image.caption || caption}</MediaCaption>
        )}
      </figure>
    );
  }

  const totalPages = calculateTotalPages(images.length, slidesPerView);
  const currentPage = getCurrentPage(current, slidesPerView);
  const shouldShowDots = showDots && images.length > slidesPerView;
  const shouldShowThumbnails = showThumbnails && images.length > 1;

  return (
    <figure className={cn(mdxStyles.spacing.media, className)}>
      <div
        className={cn(
          bordered && "overflow-hidden rounded-lg border border-border"
        )}
      >
        <Carousel
          className="w-full"
          opts={{
            align: "start",
            loop: true,
            slidesToScroll: slidesPerView > 1 ? slidesPerView : 1,
          }}
          setApi={setApi}
        >
          <CarouselContent className={getCarouselContentGap(slidesPerView)}>
            {images.map((image) => (
              <CarouselItem
                className={cn(
                  SLIDE_BASIS_CLASSES[slidesPerView],
                  slidesPerView > 1 && "px-0"
                )}
                key={`${image.src}-${image.alt}`}
              >
                <div className="relative">
                  <Image
                    alt={image.alt}
                    aspectRatio={aspectRatio}
                    className="w-full shadow-sm"
                    src={image.src}
                  />
                  {image.caption && (
                    <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <p className="text-sm text-white">{image.caption}</p>
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {!hideArrows && (
            <>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </>
          )}

          {shouldShowDots && (
            <div className="absolute right-0 bottom-4 left-0 z-10 flex justify-center space-x-2">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  aria-label={`Go to page ${index + 1}`}
                  className={cn(
                    "size-2 rounded-full mix-blend-difference transition-all duration-200",
                    currentPage === index
                      ? "scale-125 bg-white"
                      : "bg-white/50 hover:bg-white/70"
                  )}
                  key={`dot-page-${index}`}
                  onClick={() => handlePageSelect(index)}
                  type="button"
                />
              ))}
            </div>
          )}
        </Carousel>
      </div>

      {shouldShowThumbnails && (
        <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
          {images.map((image, thumbIndex) => (
            <button
              aria-label={`View image ${thumbIndex + 1}: ${image.alt}`}
              className={cn(
                "relative aspect-square overflow-hidden rounded border-2 transition-all duration-200",
                current === thumbIndex + 1
                  ? "scale-105 border-primary"
                  : "border-muted hover:border-muted-foreground/50"
              )}
              key={`${image.src}-${image.alt}`}
              onClick={() => handleThumbnailClick(thumbIndex)}
              type="button"
            >
              <Image
                alt={image.alt}
                aspectRatio="1/1"
                className="size-full object-cover"
                src={image.src}
              />
            </button>
          ))}
        </div>
      )}

      {caption && <MediaCaption>{caption}</MediaCaption>}
    </figure>
  );
};

export const ImageCarouselBlock = memo(ImageCarouselBlockComponent);
