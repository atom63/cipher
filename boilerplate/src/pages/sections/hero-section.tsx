import { ArrowRight } from "lucide-react";
import { RichButton } from "@/components/common/custom/rich-button";
import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import { Badge } from "@/components/ui/badge";
import { FadeIn, FadeUp } from "./animation";

export function HeroSection() {
  return (
    <Section
      className="relative overflow-hidden"
      gap={false}
      id="hero"
      removeTopSpacing={false}
      spacing="spacious"
    >
      <Container maxWidth="narrow" padding="x">
        <div className="relative flex flex-col items-center text-center">
          <FadeUp>
            <div className="flex items-center justify-center gap-2.5">
              <Badge variant="default">Beta</Badge>
              <Badge variant="outline">Free to use</Badge>
            </div>
          </FadeUp>

          <FadeUp delay={0.05}>
            <h1 className="mt-6 max-w-4xl text-balance font-extrabold text-8xl leading-none tracking-tight">
              A token system that aligns{" "}
              <span className="text-primary">design</span> and{" "}
              <span className="text-primary">code</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-muted-foreground text-xl leading-relaxed text-balance">
              Cipher helps you generate, update, manage, and round-trip
              structured tokens through an opinionated workflow built to keep
              design decisions and code implementation aligned.
            </p>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-muted-foreground/60 text-xs uppercase tracking-wide">
              <span>Local-only</span>
              <span className="text-border">·</span>
              <span>No telemetry</span>
              <span className="text-border">·</span>
              <span>Modern CSS ready</span>
            </div>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div className="mt-8 sm:mt-10">
              <a
                href="https://www.figma.com/community/plugin/1613643367110247078"
                rel="noopener noreferrer"
                target="_blank"
              >
                <RichButton size="lg">
                  Install plugin
                  <ArrowRight className="size-4" />
                </RichButton>
              </a>
            </div>
          </FadeUp>
        </div>
      </Container>
    </Section>
  );
}
