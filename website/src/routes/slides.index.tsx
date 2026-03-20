import { createFileRoute } from "@tanstack/react-router";
import { FileText, Presentation } from "lucide-react";
import DefaultLayout from "@/components/common/layout/default-layout";
import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import { ContentList } from "@/components/common/mdx/content/content-list";
import { EmptyState } from "@/components/ui/empty-state";
import { getPostsByType } from "@/content/utils/posts";

export const Route = createFileRoute("/slides/")({
  component: SlidesIndex,
});

function SlidesIndex() {
  const slideDecks = getPostsByType("slides");

  const items = slideDecks.map((post) => ({
    key: post.slug,
    title: post.title,
    date: post.date,
    href: `/slides/${post.slug}`,
    icon: <Presentation className="size-4" />,
  }));

  return (
    <DefaultLayout>
      <Container maxWidth="narrower">
        <Section>
          <h1 className="font-bold">Slides</h1>
          {items.length === 0 ? (
            <EmptyState
              description="Presentations will appear here once added."
              icon={<FileText />}
              title="No decks yet"
            />
          ) : (
            <ContentList items={items} withHoverPlate />
          )}
        </Section>
      </Container>
    </DefaultLayout>
  );
}
