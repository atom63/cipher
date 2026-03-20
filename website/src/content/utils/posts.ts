import type { ComponentType } from "react";

/** Format any parseable date string to "Feb 27, 2026" */
function formatDate(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return raw;
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface MDXModule {
  default: ComponentType;
  frontmatter: {
    slug?: string;
    title: string;
    date: string;
    author?: string;
    readingTime?: number;
    type: string;
    tags?: string[];
    related?: Array<{ title: string; meta: string; href?: string }>;
  };
}

const mdxModules = import.meta.glob<MDXModule>("../**/*.mdx", {
  eager: true,
});

export interface Post {
  author: string;
  Content: ComponentType;
  date: string;
  readingTime: number;
  related: Array<{ title: string; meta: string; href?: string }>;
  slug: string;
  tags: string[];
  title: string;
  type: string;
}

const MDX_EXT = /\.mdx$/;

/** Derive slug from file path: "../components/eazo-logo.mdx" → "eazo-logo" */
function slugFromPath(filePath: string): string {
  const filename = filePath.split("/").pop() ?? filePath;
  return filename.replace(MDX_EXT, "");
}

export const posts: Post[] = Object.entries(mdxModules).map(
  ([filePath, mod]) => ({
    slug: mod.frontmatter.slug || slugFromPath(filePath),
    title: mod.frontmatter.title,
    date: formatDate(mod.frontmatter.date),
    author: mod.frontmatter.author || "Flux Lab",
    readingTime: mod.frontmatter.readingTime || 1,
    type: mod.frontmatter.type,
    tags: mod.frontmatter.tags || [],
    related: mod.frontmatter.related || [],
    Content: mod.default,
  })
);

// Sort by date descending
posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

/**
 * Get post by slug
 */
export function getPostBySlug(slug: string, type?: string): Post | null {
  if (type) {
    return posts.find((p) => p.slug === slug && p.type === type) || null;
  }
  return posts.find((p) => p.slug === slug) || null;
}

/**
 * Get posts by type
 */
export function getPostsByType(type: string): Post[] {
  return posts.filter((p) => p.type === type);
}

/**
 * Get posts by tag
 */
export function getPostsByTag(tag: string): Post[] {
  return posts.filter((p) => p.tags.includes(tag));
}

/**
 * Sort posts by date (descending by default)
 */
export function sortPostsByDate(
  posts: Post[],
  order: "asc" | "desc" = "desc"
): Post[] {
  return [...posts].sort((a, b) => {
    const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
    return order === "desc" ? diff : -diff;
  });
}

/**
 * Get post navigation (previous/next)
 */
export function getPostNavigation(currentSlug: string): {
  previous: Post | null;
  next: Post | null;
} {
  const currentIndex = posts.findIndex((p) => p.slug === currentSlug);

  if (currentIndex === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: currentIndex > 0 ? (posts[currentIndex - 1] ?? null) : null,
    next: currentIndex < posts.length - 1 ? (posts[currentIndex + 1] ?? null) : null,
  };
}

/**
 * Get all unique post types found in the content
 */
export function getPostTypes(): string[] {
  const types = new Set(posts.map((p) => p.type));
  return Array.from(types).sort();
}
