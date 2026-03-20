import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileQuestion, Presentation } from "lucide-react";
import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import { MDXContentProvider } from "@/components/common/mdx/mdx-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getPostBySlug } from "@/content/utils/posts";

interface BlogPostProps {
  slug: string;
}

export default function BlogPost({ slug }: BlogPostProps) {
  const post = getPostBySlug(slug);
  const hasSlides = !!getPostBySlug(slug, "slides");

  if (!post) {
    return (
      <Container maxWidth="narrower">
        <Section>
          <EmptyState
            action={
              <Button asChild size="sm" variant="outline">
                <Link to="/blog">Back to Blog</Link>
              </Button>
            }
            description={`No post found for "${slug}".`}
            icon={<FileQuestion />}
            title="Post not found"
          />
        </Section>
      </Container>
    );
  }

  const { Content } = post;

  return (
    <Container maxWidth="narrow" padding="x">
      <Container maxWidth="narrowest" padding="none">
        <Section spacing="tight" removeTopSpacing={false}>
          <div className="mb-8">
            <Button asChild className="-ml-3 mb-6" size="sm" variant="ghost">
              <Link to="/blog">
                <ArrowLeft className="size-3.5" />
                Blog
              </Link>
            </Button>
            <h1 className="font-bold text-3xl tracking-tight">{post.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <p className="text-muted-foreground text-sm">
                {post.author} · {post.date} · {post.readingTime} min read
              </p>
              {hasSlides && (
                <Button asChild size="sm" variant="ghost">
                  <Link to="/slides/$slug" params={{ slug }}>
                    <Presentation className="size-3.5" />
                    Slides
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </Section>
      </Container>
      <Section>
        <MDXContentProvider variant="narrow">
          <Content />
        </MDXContentProvider>
      </Section>
    </Container>
  );
}
