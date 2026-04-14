import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { RichButton } from "@/components/common/custom/rich-button";
import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { FadeIn, FadeUp } from "./animation";

const FLOW = ["Figma", "Tokens", "Code"] as const;

export function BoilerplateSection() {
  const reduced = useReducedMotion();

  return (
    <Section gap={false} removeTopSpacing={false} spacing="spacious">
      <Container maxWidth="narrow" padding="all">
        <div className="flex flex-col items-center text-center">
          {/* Flow diagram — acts as the eyebrow label */}
          <FadeUp>
            <div className="flex items-center gap-3 text-muted-foreground/60 text-xs font-medium uppercase tracking-widest">
              {FLOW.map((label, i) => (
                <span key={label} className="flex items-center gap-3">
                  <span>{label}</span>
                  {i < FLOW.length - 1 && (
                    <motion.span
                      animate={reduced ? {} : { x: [0, 3, 0] }}
                      className="text-border"
                      transition={{
                        delay: i * 0.4,
                        duration: 2,
                        ease: "easeInOut",
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
            <h2 className="mt-6 max-w-xl text-balance font-extrabold text-6xl leading-none tracking-tight">
              Open source. <span className="text-primary">Start building</span>{" "}
              from here.
            </h2>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="mt-6 max-w-sm text-balance text-lg text-muted-foreground leading-relaxed">
              This landing page is open source. Clone it, customize it, ship it
              — the full Cipher token structure is already wired up.
            </p>
          </FadeUp>

          <FadeUp delay={0.15}>
            <div className="mt-8 sm:mt-10">
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
            </div>
          </FadeUp>

          <FadeIn delay={0.25}>
            <p className="mt-6 text-muted-foreground/50 text-xs uppercase tracking-wide">
              MIT · Free to use · Fork it
            </p>
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}
