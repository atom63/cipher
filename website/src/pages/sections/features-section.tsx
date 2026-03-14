import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import { FadeUp } from "./animation";
import { GenerateAnimation } from "./feature-animation/feature-1";
import { ManageAnimation } from "./feature-animation/feature-2";
import { RoundTripAnimation } from "./feature-animation/feature-3";
import { ModernCssAnimation } from "./feature-animation/feature-4";

const CARDS = [
  {
    title: "Generate + Update",
    description:
      "Build a full token system from a few brand decisions. Come back anytime to adjust and regenerate.",
    Visual: GenerateAnimation,
  },
  {
    title: "Manage",
    description:
      "Rename, edit, move, duplicate, or delete variables and styles in batch.",
    Visual: ManageAnimation,
  },
  {
    title: "Round-trip",
    description:
      "Export CSS for code, make changes, import back into Figma. Keep everything aligned.",
    Visual: RoundTripAnimation,
  },
  {
    title: "Modern CSS",
    description:
      "Outputs Tailwind v4 @theme blocks and shadcn/ui-compatible tokens out of the box.",
    Visual: ModernCssAnimation,
  },
];

export function FeaturesSection() {
  return (
    <Section id="features" gap={false} removeTopSpacing={false} spacing="generous">
      <Container maxWidth="narrow" padding="all">
        <FadeUp>
          <h2 className="max-w-lg font-bold text-4xl leading-tight tracking-tight">
            From raw variables to a usable system
          </h2>
        </FadeUp>

        <div className="mt-10 grid gap-5 sm:mt-14 md:grid-cols-2 md:gap-6">
          {CARDS.map((card, i) => (
            <FadeUp delay={i * 0.08} key={card.title}>
              <div className="flex h-full flex-col overflow-hidden rounded-xl extrude-1 bg-card">
                <div className="aspect-video bg-linear-to-b from-primary/10 to-background/0" aria-hidden="true">
                  <card.Visual />
                </div>
                <div className="mt-auto p-4">
                  <h3 className="text-lg font-bold text-foreground">{card.title}</h3>
                  <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </Container>
    </Section>
  );
}
