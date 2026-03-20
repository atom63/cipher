import { createFileRoute, useParams } from "@tanstack/react-router";
import SlidesPage from "@/pages/slides";

export const Route = createFileRoute("/slides/$slug")({
  component: SlidesSlugRoute,
});

function SlidesSlugRoute() {
  const { slug } = useParams({ from: "/slides/$slug" });
  return <SlidesPage slug={slug} />;
}
