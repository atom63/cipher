import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Container from "@/components/common/layout/container";
import Section from "@/components/common/layout/section";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { FadeUp } from "./animation";

export function BoilerplateSection() {
  const reduced = useReducedMotion();

  return (
    <Section gap={false} removeTopSpacing spacing="default">
      <Container maxWidth="narrow" padding="all">
        <FadeUp>
          <div className="group extrude-1 overflow-hidden rounded-xl bg-card transition-shadow duration-300 hover:shadow-md">
            <div className="flex flex-col items-center gap-6 px-6 py-10 text-center sm:px-10 sm:py-12">
              {/* Token flow diagram — arrows pulse on hover */}
              <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs">
                <span className="rounded-md bg-primary/10 px-2 py-1 text-primary transition-colors duration-300 group-hover:bg-primary/15">
                  Figma
                </span>
                <motion.span
                  animate={
                    reduced
                      ? {}
                      : {
                          x: [0, 2, 0, -2, 0],
                        }
                  }
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                >
                  <ArrowLeftRight className="size-3 text-border transition-colors duration-300 group-hover:text-primary/40" />
                </motion.span>
                <span className="rounded-md bg-secondary px-2 py-1 transition-colors duration-300 group-hover:bg-primary/10 group-hover:text-primary">
                  Tokens
                </span>
                <motion.span
                  animate={
                    reduced
                      ? {}
                      : {
                          x: [0, -2, 0, 2, 0],
                        }
                  }
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                >
                  <ArrowLeftRight className="size-3 text-border transition-colors duration-300 group-hover:text-primary/40" />
                </motion.span>
                <span className="rounded-md bg-primary/10 px-2 py-1 text-primary transition-colors duration-300 group-hover:bg-primary/15">
                  Code
                </span>
              </div>

              <div>
                <h3 className="font-bold text-xl tracking-tight">
                  Start building with Cipher tokens
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-balance text-muted-foreground text-sm">
                  An open-source starter that applies the full token structure.
                  Use it as a reference or boilerplate.
                </p>
              </div>

              <Button asChild variant="outline">
                <a
                  href="https://github.com/atom63/cipher"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  View on GitHub
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </a>
              </Button>
            </div>
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
