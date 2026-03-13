import { createFileRoute, useParams } from "@tanstack/react-router";
import ComponentPost from "@/pages/component-post";

export const Route = createFileRoute("/components/$slug")({
  component: ComponentSlugRoute,
});

function ComponentSlugRoute() {
  const { slug } = useParams({ from: "/components/$slug" });
  return <ComponentPost slug={slug} />;
}
