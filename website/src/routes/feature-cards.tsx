import { createFileRoute } from "@tanstack/react-router";
import FeatureCards from "@/pages/feature-cards";

export const Route = createFileRoute("/feature-cards")({
  component: FeatureCards,
});
