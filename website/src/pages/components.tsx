import { FileText } from "lucide-react";
import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import { ContentList } from "@/components/common/mdx/content/content-list";
import { EmptyState } from "@/components/ui/empty-state";
import { posts } from "@/content/utils/posts";

export default function Components() {
  const items = posts.map((post) => ({
    key: post.slug,
    title: post.title,
    date: `${post.date} · ${post.readingTime} min read`,
    href: `/components/${post.slug}`,
  }));

  return (
    <Container maxWidth="narrower">
      <Section>
        <h1 className="font-bold">Design System</h1>
        {items.length === 0 ? (
          <EmptyState
            description="Components and foundations will appear here once added."
            icon={<FileText />}
            title="No entries yet"
          />
        ) : (
          <ContentList items={items} withHoverPlate />
        )}
      </Section>
    </Container>
  );
}
