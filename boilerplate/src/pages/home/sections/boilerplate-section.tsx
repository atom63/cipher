import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { RichButton } from '@/components/common/custom/rich-button'
import Container from '@/components/common/layout/container'
import Section from '@/components/common/layout/section'
import { SectionHeader } from '@/components/common/layout/section-header'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { FadeIn, FadeUp } from './animation'

const FLOW = ['Figma', 'Tokens', 'Code'] as const

export function BoilerplateSection() {
  const reduced = useReducedMotion()

  return (
    <Section gap={false} removeTopSpacing={false} spacing="spacious">
      <Container maxWidth="narrow" padding="all">
        <div className="flex flex-col items-center text-center">
          {/* Flow diagram — acts as the eyebrow label */}
          <FadeUp>
            <div className="flex items-center gap-3 font-medium text-muted-foreground/60 text-xs uppercase tracking-widest">
              {FLOW.map((label, i) => (
                <span className="flex items-center gap-3" key={label}>
                  <span>{label}</span>
                  {i < FLOW.length - 1 && (
                    <motion.span
                      animate={reduced ? {} : { x: [0, 3, 0] }}
                      className="text-border"
                      transition={{
                        delay: i * 0.4,
                        duration: 2,
                        ease: 'easeInOut',
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    >
                      →
                    </motion.span>
                  )}
                </span>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.05}>
            <SectionHeader
              actions={
                <a
                  href="https://github.com/atom63/cipher-boilerplate"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <RichButton size="lg">
                    View on GitHub
                    <ArrowRight className="size-4" />
                  </RichButton>
                </a>
              }
              align="center"
              className="mt-6"
              description="This landing page is built with it — shadcn/ui components, Tailwind v4, and Cipher tokens all wired up. Clone it, customize it, ship it."
              title={
                <>
                  Cipher tokens in production.{' '}
                  <span className="text-primary">You&apos;re already looking at one.</span>
                </>
              }
              variant="primary"
            />
          </FadeUp>

          <FadeIn delay={0.25}>
            <p className="mt-6 text-muted-foreground/50 text-xs uppercase tracking-wide">
              MIT · Free to use · Fork it
            </p>
          </FadeIn>
        </div>
      </Container>
    </Section>
  )
}
