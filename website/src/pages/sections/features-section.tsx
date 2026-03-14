import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import { FadeUp } from "./animation";
import { GenerateAnimation } from "./feature-animation/feature-1";
import { ManageAnimation } from "./feature-animation/feature-2";
import { RoundTripAnimation } from "./feature-animation/feature-3";
import { ModernCssAnimation } from "./feature-animation/feature-4";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CARDS = [
  {
    title: "Generate + Update",
    description:
      "Generate an opinionated token structure from a small set of brand and UI decisions, then come back anytime to preview, update, and regenerate.",
    Visual: GenerateAnimation,
  },
  {
    title: "Manage",
    description:
      "Maintain your token system with comprehensive CRUD controls and batch actions for variables and styles at scale.",
    Visual: ManageAnimation,
  },
  {
    title: "Round-trip",
    description:
      "Export structured token files for code workflows, make changes outside Figma, then import them back to keep everything aligned.",
    Visual: RoundTripAnimation,
  },
  {
    title: "Modern CSS workflows",
    description:
      "Token structure designed to plug into Tailwind CSS v4 and shadcn/ui-style setups.",
    Visual: ModernCssAnimation,
  },
];

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export function FeaturesSection() {
  return (
    <Section id="features" gap={false} removeTopSpacing={false} spacing="generous">
      <Container maxWidth="narrow" padding="all">
        <FadeUp>
          <p className="font-semibold text-sm uppercase tracking-widest text-primary">
            Workflow
          </p>
          <h2 className="mt-3 max-w-lg font-bold text-4xl leading-tight tracking-tight">
            From raw variables to a usable system
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Cipher helps you generate a structured token foundation, evolve it
            over time, manage variables and styles at scale, and keep design
            and code aligned through round-trip workflows.
          </p>
        </FadeUp>

        <div className="mt-10 grid gap-5 sm:mt-14 md:grid-cols-2 md:gap-6">
          {CARDS.map((card, i) => (
            <FadeUp delay={i * 0.08} key={card.title}>
              <div className="flex h-full flex-col overflow-hidden rounded-xl border border-none extrude-1 bg-card">
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
