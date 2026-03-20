import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/slides")({
  component: SlidesLayout,
});

function SlidesLayout() {
  return <Outlet />;
}
