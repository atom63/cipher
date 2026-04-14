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
    <Section
      gap={false}
      id="features"
      removeTopSpacing={false}
      spacing="generous"
    >
      <Container maxWidth="narrow" padding="all">
        <FadeUp className="text-center">
          <h2 className="text-balance font-bold text-4xl leading-tight tracking-tight">
            From raw variables to a usable system
          </h2>
        </FadeUp>

        <div className="mt-10 grid gap-5 sm:mt-14 md:grid-cols-2 md:gap-6">
          {CARDS.map((card, i) => (
            <FadeUp delay={i * 0.08} key={card.title}>
              <div className="extrude-1 flex h-full flex-col overflow-hidden rounded-xl bg-card">
                <div
                  aria-hidden="true"
                  className="aspect-video bg-linear-to-b from-primary/10 to-background/0"
                >
                  <card.Visual />
                </div>
                <div className="mt-auto p-4">
                  <h3 className="font-bold text-foreground text-lg">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-base text-muted-foreground leading-relaxed">
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
