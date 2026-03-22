import { ArrowRight } from "lucide-react";
import { RichButton } from "@/components/common/custom/rich-button";
import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import { FadeIn, FadeUp } from "./animation";

export function CtaSection() {
  return (
    <Section id="footer-cta" removeTopSpacing={false} spacing="spacious">
      <Container maxWidth="narrow" padding="all">
        <div className="flex flex-col items-center text-center">
          <FadeUp>
            <h2 className="max-w-xl text-balance font-extrabold text-6xl leading-tight tracking-tight">
              Bring more structure to your{" "}
              <span className="text-primary">workflow</span>
            </h2>
          </FadeUp>

          <FadeUp delay={0.06}>
            <p className="mt-6 max-w-sm text-balance text-lg text-muted-foreground leading-relaxed">
              One plugin. Structured tokens. Design and code, aligned.
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="mt-8 sm:mt-10">
              <a href="https://www.figma.com/community/plugin/1613643367110247078" rel="noopener noreferrer" target="_blank">
                <RichButton size="lg">
                  Install plugin
                  <ArrowRight className="size-4" />
                </RichButton>
              </a>
              <p className="mt-3 text-muted-foreground/50 text-xs">
                If the link returns 404, the plugin is currently under Figma review.
              </p>
            </div>
          </FadeUp>

          <FadeIn delay={0.2}>
            <p className="mt-6 text-muted-foreground/50 text-xs uppercase tracking-wide">
              Free during beta · Local-only · No telemetry
            </p>
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}
