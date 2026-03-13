import { Compare } from "@/components/custom/compare/compare";
import { mdxStyles } from "@/components/mdx/mdx-styles";
import { cn } from "@/lib/utils";
import { MediaCaption } from "./media-caption";

/**
 * MDX Image Compare Block Component
 *
 * Interactive before/after image comparison slider for MDX content.
 * Built on top of the Compare component with MDX-specific styling and features:
 * - Proper vertical spacing for MDX content
 * - Optional captions for context
 * - Responsive aspect ratios
 * - Smooth slider transitions
 * - Keyboard accessible
 * - Mobile touch support
 *
 * Available aspect ratios:
 * - "16/9" (default), "4/3", "3/4", "1/1", "21/9"
 * - Or any custom CSS aspect ratio string
 *
 * @example Basic comparison
 * ```tsx
 * <ImageCompare
 *   beforeImage="/before.jpg"
 *   afterImage="/after.jpg"
 *   beforeAlt="Before state"
 *   afterAlt="After state"
 * />
 * ```
 *
 * @example With caption and custom aspect ratio
 * ```tsx
 * <ImageCompare
 *   beforeImage="/old-design.jpg"
 *   afterImage="/new-design.jpg"
 *   aspectRatio="4/3"
 *   caption="Design comparison: old vs new"
 * />
 * ```
 *
 * @example Vertical comparison
 * ```tsx
 * <ImageCompare
 *   beforeImage="/top.jpg"
 *   afterImage="/bottom.jpg"
 *   vertical
 *   caption="Vertical before/after comparison"
 * />
 * ```
 *
 * @example With custom labels
 * ```tsx
 * <ImageCompare
 *   beforeImage="/draft.jpg"
 *   afterImage="/final.jpg"
 *   beforeAlt="Draft version"
 *   afterAlt="Final version"
 *   caption="Draft vs Final: Design iteration"
 * />
 * ```
 */

export interface ImageCompareProps {
  /**
   * Alt text for the after image
   * @default "After"
   */
  afterAlt?: string;
  /**
   * The second (right/bottom) image URL
   */
  afterImage: string;
  /**
   * Aspect ratio for the images (e.g., "16/9", "4/3", "1/1")
   * @default "16/9"
   */
  aspectRatio?: string;
  /**
   * Alt text for the before image
   * @default "Before"
   */
  beforeAlt?: string;
  /**
   * The first (left/top) image URL
   */
  beforeImage: string;
  /**
   * Show border around the compare slider
   * @default true
   */
  bordered?: boolean;
  /**
   * Optional caption text
   */
  caption?: string;
  /**
   * Whether the slider position changes on hover
   * @default false
   */
  changePositionOnHover?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Object fit for the images
   * @default "cover"
   */
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  /**
   * Initial slider position (0-100)
   * @default 50
   */
  position?: number;
  /**
   * Whether to reset position to center on mouse leave
   * @default false
   */
  resetOnLeave?: boolean;
  /**
   * Whether the slider should be vertical
   * @default false
   */
  vertical?: boolean;
}

export function ImageCompare({
  beforeImage,
  afterImage,
  beforeAlt = "Before",
  afterAlt = "After",
  aspectRatio = "16/9",
  caption,
  className,
  vertical = false,
  objectFit = "cover",
  position = 50,
  bordered = true,
  resetOnLeave = true,
  changePositionOnHover = false,
}: ImageCompareProps) {
  return (
    <figure className={cn(mdxStyles.spacing.media, className)}>
      <Compare
        afterAlt={afterAlt}
        afterImage={afterImage}
        aspectRatio={aspectRatio}
        beforeAlt={beforeAlt}
        beforeImage={beforeImage}
        bordered={bordered}
        changePositionOnHover={changePositionOnHover}
        objectFit={objectFit}
        position={position}
        resetOnLeave={resetOnLeave}
        vertical={vertical}
      />
      {caption && <MediaCaption>{caption}</MediaCaption>}
    </figure>
  );
}

export default ImageCompare;
