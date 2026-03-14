import { ArrowRight, BookOpen } from "lucide-react";
import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import { Button } from "@/components/ui/button";
import { RichButton } from "@/components/common/custom/rich-button";
import { FadeUp, FadeIn } from "./animation";

export function CtaSection() {
  return (
    <Section
      id="footer-cta"
      className="flex flex-col items-center border-t border-border/40 bg-card/30 text-center"
      removeTopSpacing={false}
      spacing="spacious"
    >
      <Container maxWidth="narrow" padding="all">
        <FadeUp className="flex flex-col items-center">
          <h2 className="max-w-xl font-extrabold text-6xl leading-tight tracking-tight text-balance">
            Bring more structure to your design and code workflow
          </h2>
        </FadeUp>

        <FadeUp delay={0.06} className="flex flex-col items-center">
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Generate, update, manage, and round-trip tokens through a workflow
            built for readability, consistency, and real product use.
          </p>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
            <RichButton size="lg">
              Install plugin
              <ArrowRight className="size-4" />
            </RichButton>
            <Button asChild size="lg" variant="outline">
              <a href="/docs">
                <BookOpen className="size-4" />
                View docs
              </a>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <a href="https://github.com/atom63/cipher" rel="noopener noreferrer" target="_blank">
                View boilerplate
              </a>
            </Button>
          </div>
        </FadeUp>

        <FadeIn delay={0.2}>
          <p className="mt-6 text-xs tracking-wide text-muted-foreground/50 uppercase">
            Free during beta
          </p>
        </FadeIn>
      </Container>
    </Section>
  );
}
