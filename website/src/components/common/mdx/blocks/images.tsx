import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type PhotoSwipeImage,
  usePhotoSwipe,
} from "@/components/common/custom/photo-swipe";
import { MediaCaption } from "@/components/common/mdx/blocks/media-caption";
import { mdxStyles } from "@/components/common/mdx/mdx-styles";
import Image, { type AspectRatio } from "@/components/ui/image";
import { cn } from "@/lib/utils";

/**
 * MDX Image Component
 *
 * Enhanced image component for MDX with support for various aspect ratios and layouts.
 * Built on top of the Image component from @/components/ui/image which provides:
 * - Lazy loading with intersection observer (100px rootMargin by default)
 * - Skeleton loading states while images load
 * - Optimized async image decoding for better performance
 * - Smooth fade-in animations (respects prefers-reduced-motion)
 * - Error handling with customizable fallback messages
 * - Session-level animation cache (prevents re-animations)
 * - Support for priority loading (disables lazy loading for above-fold images)
 * - Responsive behavior and multiple aspect ratios
 *
 * Available aspect ratios:
 * - "auto" (natural dimensions)
 * - "1/1", "4/3", "3/4", "16/9", "9/16"
 * - "2/3", "3/2", "5/4", "21/9", "9/21"
 *
 * @example Basic usage
 * ```tsx
 * <MDXImage src="/path.jpg" alt="Description" />
 * ```
 *
 * @example With aspect ratio and caption
 * ```tsx
 * <MDXImage
 *   src="/path.jpg"
 *   aspectRatio="16/9"
 *   caption="Image caption"
 * />
 * ```
 *
 * @example Priority loading (no lazy loading)
 * ```tsx
 * <MDXImage
 *   src="/hero.jpg"
 *   aspectRatio="21/9"
 *   priority
 * />
 * ```
 */

export interface MDXImageProps {
  alt?: string;
  aspectRatio?: AspectRatio;
  caption?: string;
  className?: string;
  priority?: boolean;
  src: string;
}

export function MDXImage({
  src,
  alt,
  aspectRatio = "auto",
  caption,
  priority = false,
  className,
}: MDXImageProps) {
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (!src) {
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = src;
  }, [src]);

  const lightboxImages = useMemo<PhotoSwipeImage[]>(() => {
    if (!(src && imageDimensions)) {
      return [];
    }
    return [
      {
        src,
        width: imageDimensions.width,
        height: imageDimensions.height,
        alt: alt || "",
      },
    ];
  }, [src, imageDimensions, alt]);

  const { openPhotoSwipe } = usePhotoSwipe(lightboxImages);

  const handleImageClick = useCallback(() => {
    if (lightboxImages.length > 0) {
      openPhotoSwipe(0);
    }
  }, [lightboxImages.length, openPhotoSwipe]);

  const imageElement = (
    <button
      className="w-full cursor-zoom-in border-none bg-transparent p-0"
      onClick={handleImageClick}
      type="button"
    >
      <Image
        alt={alt}
        aspectRatio={aspectRatio}
        className={cn("overflow-hidden rounded-lg", className)}
        lazy={!priority}
        priority={priority}
        src={src}
      />
    </button>
  );

  if (caption) {
    return (
      <figure className={mdxStyles.spacing.media}>
        {imageElement}
        <MediaCaption>{caption}</MediaCaption>
      </figure>
    );
  }

  return <div className={mdxStyles.spacing.media}>{imageElement}</div>;
}

/**
 * Image Grid Component
 *
 * Display multiple images in a responsive grid layout.
 * Uses the Image component with lazy loading and optimized rendering.
 *
 * @example 2-column grid
 * ```tsx
 * <ImageGrid cols={2}>
 *   <MDXImage src="/1.jpg" alt="Image 1" />
 *   <MDXImage src="/2.jpg" alt="Image 2" />
 * </ImageGrid>
 * ```
 *
 * @example 3-column grid with custom gap
 * ```tsx
 * <ImageGrid cols={3} gap="lg">
 *   <MDXImage src="/1.jpg" aspectRatio="4/3" />
 *   <MDXImage src="/2.jpg" aspectRatio="4/3" />
 *   <MDXImage src="/3.jpg" aspectRatio="4/3" />
 * </ImageGrid>
 * ```
 */
export interface ImageGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
}

export function ImageGrid({
  children,
  cols = 2,
  gap = "md",
  className,
}: ImageGridProps) {
  const gridStyles = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  const gapStyles = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  };

  return (
    <div
      className={cn(
        mdxStyles.spacing.media,
        "grid [&>*]:my-0",
        gridStyles[cols],
        gapStyles[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Image Comparison Component
 *
 * Side-by-side image comparison with consistent aspect ratios.
 * Perfect for before/after scenarios, design iterations, etc.
 * Both images use the Image component with lazy loading.
 *
 * @example Basic comparison
 * ```tsx
 * <ImageComparison
 *   before={{ src: "/before.jpg", alt: "Before" }}
 *   after={{ src: "/after.jpg", alt: "After" }}
 *   aspectRatio="16/9"
 * />
 * ```
 *
 * @example With custom labels
 * ```tsx
 * <ImageComparison
 *   before={{ src: "/draft.jpg", alt: "Draft version" }}
 *   after={{ src: "/final.jpg", alt: "Final version" }}
 *   aspectRatio="4/3"
 *   labels={{ before: "Draft", after: "Final" }}
 * />
 * ```
 */
export interface ImageComparisonProps {
  after: { alt?: string; src: string };
  aspectRatio?: AspectRatio;
  before: { alt?: string; src: string };
  className?: string;
  labels?: { after?: string; before?: string };
}

export function ImageComparison({
  before,
  after,
  aspectRatio = "16/9",
  labels = { before: "Before", after: "After" },
  className,
}: ImageComparisonProps) {
  return (
    <div
      className={cn(
        mdxStyles.spacing.media,
        "grid grid-cols-2 gap-4",
        className
      )}
    >
      <div className="space-y-2">
        {labels.before && (
          <div className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            {labels.before}
          </div>
        )}
        <Image alt={before.alt} aspectRatio={aspectRatio} src={before.src} />
      </div>
      <div className="space-y-2">
        {labels.after && (
          <div className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            {labels.after}
          </div>
        )}
        <Image alt={after.alt} aspectRatio={aspectRatio} src={after.src} />
      </div>
    </div>
  );
}

export default MDXImage;
