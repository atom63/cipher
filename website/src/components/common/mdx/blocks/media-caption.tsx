import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { mdxStyles } from "../mdx-styles";

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
    <figcaption className={cn(mdxStyles.content.figcaption, className)}>
      {children}
    </figcaption>
  );
}
