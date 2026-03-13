import { createFileRoute, Outlet } from "@tanstack/react-router";
import DefaultLayout from "@/components/common/layout/default-layout";

export const Route = createFileRoute("/components")({
  component: ComponentsLayout,
});

function ComponentsLayout() {
  return (
    <DefaultLayout>
      <Outlet />
    </DefaultLayout>
  );
}
