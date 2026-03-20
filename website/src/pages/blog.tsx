import { FileText } from "lucide-react";
import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import { ContentList } from "@/components/common/mdx/content/content-list";
import { EmptyState } from "@/components/ui/empty-state";
import { getPostsByType } from "@/content/utils/posts";

export default function Blog() {
  const blogPosts = getPostsByType("blog");

  const items = blogPosts.map((post) => ({
    key: post.slug,
    title: post.title,
    date: `${post.date} · ${post.readingTime} min read`,
    href: `/blog/${post.slug}`,
  }));

  return (
    <Container maxWidth="narrower">
      <Section>
        <h1 className="font-bold">Blog</h1>
        {items.length === 0 ? (
          <EmptyState
            description="Posts will appear here once published."
            icon={<FileText />}
            title="No posts yet"
          />
        ) : (
          <ContentList items={items} withHoverPlate />
        )}
      </Section>
    </Container>
  );
}
