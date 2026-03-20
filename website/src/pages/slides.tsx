import { Link } from "@tanstack/react-router";
import { FileQuestion } from "lucide-react";
import { SlideViewer } from "@/app/slides/components/slide-viewer";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getPostBySlug } from "@/content/utils/posts";

interface SlidesPageProps {
  slug: string;
}

export default function SlidesPage({ slug }: SlidesPageProps) {
  const post = getPostBySlug(slug, "slides");

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <EmptyState
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/slides">Back to Slides</Link>
            </Button>
          }
          description={`No post found for "${slug}".`}
          icon={<FileQuestion />}
          title="Post not found"
        />
      </div>
    );
  }

  return (
    <SlideViewer
      Content={post.Content}
      title={post.title}
    />
  );
}
