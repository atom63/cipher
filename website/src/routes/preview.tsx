import { createFileRoute } from "@tanstack/react-router";
import Preview from "@/pages/preview";

export const Route = createFileRoute("/preview")({
  component: Preview,
});
