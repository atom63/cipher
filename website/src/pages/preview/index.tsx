import Container from '@/components/common/layout/container'
import DefaultLayout from '@/components/common/layout/default-layout'
import Section from '@/components/common/layout/section'
import { SectionHeader } from '@/components/common/layout/section-header'
import { Button } from '@/components/ui/button'
import { usePageMeta } from '@/hooks/use-page-meta'
import { CtaSection } from '@/pages/home/sections/cta-section'

import { RootComponents } from './components'

export default function Preview() {
  usePageMeta({
    title: 'UI Preview',
    description: 'Design system component preview and token showcase.',
  })

  return (
    <DefaultLayout>
      <Section>
        <Container maxWidth="narrow" padding="all">
          <SectionHeader
            actions={
              <>
                <Button asChild>
                  <a
                    href="https://www.figma.com/community/plugin/1613643367110247078"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Try Cipher
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href="https://ui.shadcn.com/" rel="noopener noreferrer" target="_blank">
                    shadcn/ui docs
                  </a>
                </Button>
              </>
            }
            align="center"
            description="Cipher's token structure extends shadcn/ui's design system — same conventions, same CSS variables, same component API. Drop it into any shadcn project and your tokens just work."
            title="Built on shadcn/ui, ready out of the box"
            variant="primary"
          />
        </Container>
        <Container
          className="rounded-xl border border-border bg-background"
          maxWidth="wider"
          padding="all"
        >
          <RootComponents />
        </Container>
      </Section>
      <CtaSection />
    </DefaultLayout>
  )
}
