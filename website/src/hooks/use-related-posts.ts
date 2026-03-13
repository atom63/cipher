import { useMemo } from "react";
import type { ContentNavItem } from "@/components/mdx/content/content-nav";
import { posts } from "@/content/utils/posts";
import { getRelatedPosts } from "@/content/utils/related-posts";

/**
 * Hook to get related posts for the current post
 *
 * Strategy:
 * 1. If post has manual `related` items in frontmatter, use those first
 * 2. If manual items have no href, auto-generate the href from title matching
 * 3. Fill remaining slots with auto-suggested posts based on similarity
 *
 * @param currentSlug - Slug of the current post
 * @param manualRelated - Manual related items from frontmatter
 * @param maxResults - Maximum number of related posts to return
 * @returns Array of related post items ready for ContentNav
 */
export function useRelatedPosts(
  currentSlug: string,
  manualRelated: Array<{ title: string; meta: string; href?: string }> = [],
  maxResults = 4
): ContentNavItem[] {
  return useMemo(
    () => getRelatedPosts(currentSlug, posts, manualRelated, maxResults),
    [currentSlug, manualRelated, maxResults]
  );
}
