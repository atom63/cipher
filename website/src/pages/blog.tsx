import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { FileText } from "lucide-react";
import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import { EmptyState } from "@/components/ui/empty-state";
import { siteConfig } from "@/config/site";
import { usePageMeta } from "@/hooks/use-page-meta";
import { getPostsByType, type Post } from "@/content/utils/posts";

function BlogList({ posts }: { posts: Post[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<{
    top: number;
    height: number;
  } | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    const container = containerRef.current;
    if (!container) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setHovered({
      top: rect.top - containerRect.top,
      height: rect.height,
    });
  };

  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => setHovered(null), 150);
  };

  return (
    <div className="relative" ref={containerRef}>
      <AnimatePresence>
        {hovered && (
          <motion.div
            animate={{
              top: hovered.top,
              height: hovered.height,
              opacity: 1,
            }}
            className="absolute -inset-x-3 rounded-xl bg-accent/50"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="hover-plate"
            transition={{
              top: { type: "spring", stiffness: 400, damping: 30 },
              height: { type: "spring", stiffness: 400, damping: 30 },
              opacity: { duration: 0.2, ease: "easeInOut" },
            }}
          />
        )}
      </AnimatePresence>
      <div className="relative flex flex-col gap-4">
        {posts.map((post) => (
          <article key={post.slug}>
            <Link
              className="group block py-2 no-underline"
              to="/blog/$slug"
              params={{ slug: post.slug }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <h2 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              {post.description && (
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {post.description}
                </p>
              )}
              <p className="mt-1.5 text-xs text-muted-foreground">
                {post.date} · {post.readingTime} min read
              </p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function Blog() {
  const blogPosts = getPostsByType("blog");

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Cipher Blog",
      description:
        "Articles on design tokens, Figma workflows, and building design systems from scratch.",
      url: `${siteConfig.url}/blog`,
      publisher: {
        "@type": "Organization",
        name: siteConfig.name,
        url: siteConfig.url,
      },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: blogPosts.map((post, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${siteConfig.url}/blog/${post.slug}`,
          name: post.title,
        })),
      },
    }),
    [blogPosts]
  );

  usePageMeta({
    title: "Blog",
    description:
      "Articles on design tokens, Figma workflows, and building design systems from scratch.",
    keywords: [
      "design tokens",
      "figma",
      "design systems",
      "css variables",
      "blog",
    ],
    ogUrl: `${siteConfig.url}/blog`,
    jsonLd,
  });

  return (
    <Container maxWidth="narrower">
      <Section>
        <h1 className="font-bold">Blog</h1>
        {blogPosts.length === 0 ? (
          <EmptyState
            description="Posts will appear here once published."
            icon={<FileText />}
            title="No posts yet"
          />
        ) : (
          <BlogList posts={blogPosts} />
        )}
      </Section>
    </Container>
  );
}
