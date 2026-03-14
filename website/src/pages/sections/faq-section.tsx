import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from "@/components/ui/accordion";
import { FadeUp } from "./animation";

const FAQ_ITEMS = [
  {
    q: 'What does "opinionated" mean?',
    a: "Cipher prioritizes a clear token structure over infinite flexibility. It favors readability, consistency, and maintainability.",
  },
  {
    q: "Is Cipher free?",
    a: "Yes. Free to use during beta.",
  },
  {
    q: "Does it use external servers?",
    a: "No. Cipher runs locally inside Figma. No cloud sync, no telemetry.",
  },
  {
    q: "Who is Cipher for?",
    a: "Designers and developers who care about readable token systems and alignment between design and code.",
  },
  {
    q: "What is the open-source starter?",
    a: "A public repo that applies Cipher's token structure in code. Use it as a reference or boilerplate.",
  },
  {
    q: "Why is Cipher in beta?",
    a: "It's usable today, but the workflow and feature set are still evolving. The beta label sets expectations while the product improves.",
  },
];

export function FaqSection() {
  return (
    <Section id="faq" gap={false} removeTopSpacing={false} spacing="generous">
      <Container maxWidth="narrow" padding="all">
        <FadeUp>
          <h2 className="mb-6 font-bold text-4xl leading-tight tracking-tight">
            FAQ
          </h2>
          <Accordion defaultValue={[0]}>
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={i}>
                <AccordionTrigger className="text-base">
                  {item.q}
                </AccordionTrigger>
                <AccordionPanel className="text-sm leading-relaxed">
                  {item.a}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeUp>
      </Container>
    </Section>
  );
}
