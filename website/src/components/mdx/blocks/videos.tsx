import { MediaCaption } from "@/components/mdx/blocks/media-caption";
import { mdxStyles } from "@/components/mdx/mdx-styles";
import { Video } from "@/components/ui/video";
import { cn } from "@/lib/utils";

/**
 * MDX Video Component
 *
 * Enhanced video component for MDX with support for various aspect ratios and layouts.
 * Built on top of the Video component from @/components/ui/video which provides:
 * - Auto-detection of video MIME type from file extension
 * - Thumbnail mode (autoplay, muted, loop, no controls) for single video files
 * - Multiple source support for cross-browser compatibility
 * - Smooth responsive behaviour
 *
 * Available aspect ratios:
 * - "auto" (natural dimensions)
 * - "16/9", "9/16", "4/3", "3/4", "1/1", "21/9"
 *
 * @example Basic usage – auto-detects thumbnail mode for video files
 * ```tsx
 * <MDXVideo src="/path/to/clip.mp4" />
 * ```
 *
 * @example Controlled playback with caption
 * ```tsx
 * <MDXVideo
 *   src="/path/to/clip.mp4"
 *   caption="A looping preview of the interaction"
 *   controls
 * />
 * ```
 *
 * @example Multiple sources (cross-browser)
 * ```tsx
 * <MDXVideo
 *   sources={[
 *     { src: "/clip.webm" },
 *     { src: "/clip.mp4" },
 *   ]}
 *   aspectRatio="16/9"
 *   caption="Render comparison"
 * />
 * ```
 *
 */

export type VideoAspectRatio =
  | "auto"
  | "1/1"
  | "4/3"
  | "3/4"
  | "16/9"
  | "9/16"
  | "21/9";

export interface MDXVideoSource {
  src: string;
  type?: string;
}

export interface MDXVideoProps {
  alt?: string;
  aspectRatio?: VideoAspectRatio;
  /** Force thumbnail mode (autoplay, muted, loop, no controls) */
  asThumbnail?: boolean;
  caption?: string;
  className?: string;
  /** Expose native video controls */
  controls?: boolean;
  sources?: MDXVideoSource[];
  /** Shorthand for a single source path; ignored when `sources` is provided */
  src?: string;
}

export function MDXVideo({
  src,
  sources,
  alt,
  caption,
  aspectRatio = "auto",
  className,
  asThumbnail,
  controls,
}: MDXVideoProps) {
  const resolvedSources: MDXVideoSource[] = sources ?? (src ? [{ src }] : []);

  if (resolvedSources.length === 0) {
    return null;
  }

  const aspectStyles = getAspectStyles(aspectRatio);

  const videoElement = (
    <div className={cn("overflow-hidden rounded-lg", aspectStyles, className)}>
      <Video
        asThumbnail={asThumbnail}
        className="h-full w-full object-cover"
        controls={controls}
        fallbackText={alt}
        sources={resolvedSources}
      />
    </div>
  );

  if (caption) {
    return (
      <figure className={mdxStyles.spacing.media}>
        {videoElement}
        <MediaCaption>{caption}</MediaCaption>
      </figure>
    );
  }

  return <div className={mdxStyles.spacing.media}>{videoElement}</div>;
}

/**
 * Video Grid Component
 *
 * Display multiple videos in a responsive grid layout.
 *
 * @example 2-column grid
 * ```tsx
 * <VideoGrid cols={2}>
 *   <MDXVideo src="/1.mp4" />
 *   <MDXVideo src="/2.mp4" />
 * </VideoGrid>
 * ```
 */
export interface VideoGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
}

export function VideoGrid({
  children,
  cols = 2,
  gap = "md",
  className,
}: VideoGridProps) {
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function getAspectStyles(aspectRatio: VideoAspectRatio): string {
  switch (aspectRatio) {
    case "1/1":
      return "aspect-square";
    case "4/3":
      return "aspect-[4/3]";
    case "3/4":
      return "aspect-[3/4]";
    case "16/9":
      return "aspect-video";
    case "9/16":
      return "aspect-[9/16]";
    case "21/9":
      return "aspect-[21/9]";
    default:
      return "";
  }
}

export default MDXVideo;
