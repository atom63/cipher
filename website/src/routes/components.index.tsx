import { createFileRoute } from "@tanstack/react-router";
import Components from "@/pages/components";

export const Route = createFileRoute("/components/")({
  component: Components,
});
