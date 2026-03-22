import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenerateAnimation } from "@/pages/sections/feature-animation/feature-1";
import { ManageAnimation } from "@/pages/sections/feature-animation/feature-2";
import { RoundTripAnimation } from "@/pages/sections/feature-animation/feature-3";
import { ModernCssAnimation } from "@/pages/sections/feature-animation/feature-4";

const CARDS = [
  {
    title: "Generate + Update",
    description:
      "Build a full token system from a few brand decisions. Come back anytime to adjust and regenerate.",
    Visual: GenerateAnimation,
  },
  {
    title: "Manage",
    description:
      "Rename, edit, move, duplicate, or delete variables and styles in batch.",
    Visual: ManageAnimation,
  },
  {
    title: "Round-trip",
    description:
      "Export CSS for code, make changes, import back into Figma. Keep everything aligned.",
    Visual: RoundTripAnimation,
  },
  {
    title: "Modern CSS",
    description:
      "Outputs Tailwind v4 @theme blocks and shadcn/ui-compatible tokens out of the box.",
    Visual: ModernCssAnimation,
  },
];

const AUTO_ADVANCE_MS = 7000;

export default function FeatureCards() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback(
    (next: number) => {
      setDirection(next > active ? 1 : -1);
      setActive(next);
    },
    [active],
  );

  const next = useCallback(() => {
    go((active + 1) % CARDS.length);
  }, [active, go]);

  const prev = useCallback(() => {
    go((active - 1 + CARDS.length) % CARDS.length);
  }, [active, go]);

  // Auto-advance
  useEffect(() => {
    timerRef.current = setTimeout(next, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, next]);

  const card = CARDS[active]!;
  const Visual = card.Visual;

  const variants = {
    enter: (d: number) => ({ x: `${d * 100}%`, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: `${d * -100}%`, opacity: 0 }),
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-8">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        {/* Card */}
        <div className="relative w-full overflow-hidden rounded-xl">
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={active}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="extrude-1 flex w-full flex-col overflow-hidden rounded-xl bg-card"
            >
              <div
                aria-hidden="true"
                className="aspect-video bg-linear-to-b from-primary/10 to-background/0"
              >
                <Visual />
              </div>
              <div className="p-5">
                <h2 className="font-bold text-foreground text-xl">
                  {card.title}
                </h2>
                <p className="mt-1.5 text-base text-muted-foreground leading-relaxed text-balance">
                  {card.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon-sm" onClick={prev}>
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-2">
            {CARDS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                className="group relative flex h-5 items-center justify-center"
              >
                <span className="block size-2 rounded-full bg-muted-foreground/30 transition-colors group-hover:bg-muted-foreground/60" />
                {i === active && (
                  <motion.span
                    layoutId="dot"
                    className="absolute block size-2 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          <Button variant="outline" size="icon-sm" onClick={next}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
