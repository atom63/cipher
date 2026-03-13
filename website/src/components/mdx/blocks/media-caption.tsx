import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MediaCaptionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Consistent caption styling for all media blocks
 *
 * @example
 * ```tsx
 * <MediaCaption>This is a caption for an image</MediaCaption>
 * ```
 */
export function MediaCaption({ children, className }: MediaCaptionProps) {
  if (!children) {
    return null;
  }

  return (
    <figcaption
      className={cn(
        "type-subhead mt-3 text-center text-muted-foreground leading-relaxed",
        className
      )}
    >
      {children}
    </figcaption>
  );
}
