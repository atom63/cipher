import Container from '@/components/common/layout/container'
import Section from '@/components/common/layout/section'
import { SectionHeader } from '@/components/common/layout/section-header'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { FadeUp } from './animation'

const FAQ_ITEMS = [
  {
    q: 'What does "opinionated" mean?',
    a: 'Cipher prioritizes a clear token structure over infinite flexibility. It favors readability, consistency, and maintainability.',
  },
  {
    q: 'Is Cipher free?',
    a: 'Yes. Free to use during beta.',
  },
  {
    q: 'Does it use external servers?',
    a: 'No. Cipher runs locally inside Figma. No cloud sync, no telemetry.',
  },
  {
    q: 'Who is Cipher for?',
    a: 'Designers and developers who care about readable token systems and alignment between design and code.',
  },
  {
    q: 'Why is Cipher in beta?',
    a: "It's usable today, but the workflow and feature set are still evolving. The beta label sets expectations while the product improves.",
  },
]

export function FaqSection() {
  return (
    <Section gap={false} id="faq" removeTopSpacing={false} spacing="generous">
      <Container maxWidth="narrowest" padding="all">
        <FadeUp>
          <SectionHeader
            align="center"
            className="mb-6"
            title="Questions you might have"
            variant="muted"
          />
          <Accordion defaultValue="0" type="single">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={item.q} value={String(i)}>
                <AccordionTrigger className="text-lg">{item.q}</AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeUp>
      </Container>
    </Section>
  )
}
