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
    a: "Cipher is built around a clear token structure and workflow philosophy. Instead of supporting every possible setup equally, it prioritizes readability, consistency, and maintainability.",
  },
  {
    q: "Is Cipher free to use?",
    a: "Yes. Cipher is currently free to use during beta.",
  },
  {
    q: "Why is Cipher in beta?",
    a: "Cipher is already usable today, but the workflow, docs, and feature set are still evolving. The beta label helps set expectations clearly while the product continues to improve.",
  },
  {
    q: "What can Cipher generate?",
    a: "Cipher can generate a structured token system from configurable inputs such as brand colors, surface colors, status colors, radius ramps, and type scale ramps.",
  },
  {
    q: "Can I update an existing Cipher-generated system?",
    a: "Yes. You can reopen the generation workflow, preview the current setup, change core values, and regenerate the system in Figma.",
  },
  {
    q: "What can Cipher manage?",
    a: "Cipher supports CRUD and batch actions for variables and styles, including rename, edit, move, duplicate, and delete.",
  },
  {
    q: "Can I export tokens for code and import them back?",
    a: "Yes. Cipher supports round-trip workflows by exporting structured token files and importing changes back into Figma.",
  },
  {
    q: "Does Cipher use cloud sync or external servers?",
    a: "No. Cipher is local-only and does not use external servers or telemetry.",
  },
  {
    q: "Who is Cipher for?",
    a: "Cipher is for designers and developers who care about readable token systems and stronger alignment between design and code.",
  },
  {
    q: "What is the open-source website starter?",
    a: "It is a public starter repo that applies Cipher's token structure in code, so you can explore the workflow or build on top of it outside the plugin UI.",
  },
];

export function FaqSection() {
  return (
    <Section id="faq" gap={false} removeTopSpacing={false} spacing="generous">
      <Container maxWidth="narrow" padding="all">
        <FadeUp>
          <div className="overflow-hidden rounded-xl border border-border/60 extrude-1">
            {/* Header */}
            <div className="border-b border-border/40 bg-card/80 px-6 py-5 sm:px-8 sm:py-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Questions
              </p>
              <h2 className="mt-2 font-bold text-3xl leading-tight tracking-tight">
                FAQ
              </h2>
            </div>

            {/* Accordion inset */}
            <div className="mx-4 my-4 rounded-lg bg-background/60 px-4 sm:mx-6 sm:my-5 sm:px-6 intrude-1">
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
            </div>
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
