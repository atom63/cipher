import { createFileRoute, useParams } from "@tanstack/react-router";
import BlogPost from "@/pages/blog-post";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogSlugRoute,
});

function BlogSlugRoute() {
  const { slug } = useParams({ from: "/blog/$slug" });
  return <BlogPost slug={slug} />;
}
