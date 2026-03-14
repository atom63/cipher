import { ArrowRight } from "lucide-react";
import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import { Badge } from "@/components/ui/badge";
import { RichButton } from "@/components/common/custom/rich-button";
import { FadeUp, FadeIn } from "./animation";

export function HeroSection() {
  return (
    <Section
      id="hero"
      className="relative overflow-hidden"
      gap={false}
      removeTopSpacing={false}
      spacing="spacious"
    >
      <Container maxWidth="narrow" padding="x">
        <div className="relative flex flex-col items-center text-center">
          <FadeUp>
            <div className="flex items-center justify-center gap-2.5">
              <Badge size="lg" variant="primaryMuted">Beta</Badge>
              <Badge size="lg" variant="secondary">Free to use</Badge>
            </div>
          </FadeUp>

          <FadeUp delay={0.05}>
            <h1 className="mt-6 max-w-4xl font-extrabold text-8xl leading-none tracking-tight text-balance">
              A token system that aligns{" "}
              <span className="text-primary">design</span> and{" "}
              <span className="text-primary">code</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="mx-auto mt-6 max-w-lg text-xl leading-relaxed text-muted-foreground">
              Cipher helps you generate, update, manage, and round-trip
              structured tokens through an opinionated workflow built to keep
              design decisions and code implementation aligned.
            </p>
          </FadeUp>

          <FadeUp delay={0.15}>
            <div className="mt-8 sm:mt-10">
              <RichButton size="lg">
                Install plugin
                <ArrowRight className="size-4" />
              </RichButton>
            </div>
          </FadeUp>

          <FadeIn delay={0.3}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs tracking-wide text-muted-foreground/60 uppercase">
              <span>Local-only</span>
              <span className="text-border">·</span>
              <span>No telemetry</span>
              <span className="text-border">·</span>
              <span>Modern CSS ready</span>
            </div>
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}
