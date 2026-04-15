import { ArrowRight } from 'lucide-react'
import { RichButton } from '@/components/common/custom/rich-button'
import Container from '@/components/common/layout/container'
import Section from '@/components/common/layout/section'
import { SectionHeader } from '@/components/common/layout/section-header'
import { Button } from '@/components/ui/button'
import { FadeIn, FadeUp } from './animation'

export function CtaSection() {
  return (
    <Section id="footer-cta" removeTopSpacing={false} spacing="spacious">
      <Container maxWidth="narrow" padding="all">
        <div className="flex flex-col items-center text-center">
          <FadeUp>
            <SectionHeader
              actions={
                <>
                  <a
                    href="https://www.figma.com/community/plugin/1613643367110247078"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <RichButton size="lg">
                      Try plugin
                      <ArrowRight className="size-4" />
                    </RichButton>
                  </a>
                  <Button asChild size="lg" variant="outline">
                    <a
                      href="https://github.com/atom63/cipher-boilerplate"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Get boilerplate
                      <ArrowRight className="size-4" />
                    </a>
                  </Button>
                </>
              }
              align="center"
              description="One plugin. Structured tokens. Design and code, aligned."
              title={
                <>
                  Bring more structure to your <span className="text-primary">workflow</span>
                </>
              }
              variant="primary"
            />
          </FadeUp>

          <FadeIn delay={0.2}>
            <p className="mt-6 text-muted-foreground/50 text-xs uppercase tracking-wide">
              Free during beta · Local-only · No telemetry
            </p>
          </FadeIn>
        </div>
      </Container>
    </Section>
  )
}
