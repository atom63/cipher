import { Link } from "@tanstack/react-router";
import { FileQuestion } from "lucide-react";
import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import { SectionHeader } from "@/components/common/layout/section-header";
import { MDXContentProvider } from "@/components/common/mdx/mdx-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getPostBySlug } from "@/content/utils/posts";

interface ComponentPostProps {
  slug: string;
}

export default function ComponentPost({ slug }: ComponentPostProps) {
  const post = getPostBySlug(slug);

  if (!post) {
    return (
      <Container maxWidth="narrower">
        <Section>
          <EmptyState
            action={
              <Button asChild size="sm" variant="outline">
                <Link to="/components">Back to Design System</Link>
              </Button>
            }
            description={`No entry found for "${slug}".`}
            icon={<FileQuestion />}
            title="Page not found"
          />
        </Section>
      </Container>
    );
  }

  const { Content } = post;

  return (
    <Container maxWidth="narrower">
      <Section>
        <SectionHeader
          description={`${post.date} · ${post.readingTime} min read`}
          title={post.title}
        />
        <MDXContentProvider>
          <Content />
        </MDXContentProvider>
      </Section>
    </Container>
  );
}
