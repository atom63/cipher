import { createFileRoute, Outlet } from "@tanstack/react-router";
import DefaultLayout from "@/components/common/layout/default-layout";

export const Route = createFileRoute("/blog")({
  component: BlogLayout,
});

function BlogLayout() {
  return (
    <DefaultLayout>
      <Outlet />
    </DefaultLayout>
  );
}
