import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ContentCard } from "./content-card";

type SpacingVariant = "none" | "sm" | "default" | "lg" | "xl";

const SPACING_STYLES: Record<SpacingVariant, string> = {
  none: "",
  sm: "mt-8",
  default: "mt-12",
  lg: "mt-16",
  xl: "mt-24",
} as const;

export interface ContentNavItem {
  href: string;
  meta: string;
  title: string;
}

export interface ContentNavProps {
  className?: string;
  items: ContentNavItem[];
  spacing?: SpacingVariant;
  title?: string;
}

export function ContentNav({
  items,
  title = "Related Posts",
  spacing = "xl",
  className,
}: ContentNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<{
    top: number;
    height: number;
  } | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!items || items.length === 0) {
    return null;
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setHovered({
      top: rect.top - containerRect.top,
      height: rect.height,
    });
  };

  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => setHovered(null), 150);
  };

  return (
    <section
      className={cn(
        "not-mdx border-border border-t pt-12",
        SPACING_STYLES[spacing],
        className
      )}
    >
      <h2 className="mb-8 font-medium text-muted-foreground text-sm uppercase tracking-wide">
        {title}
      </h2>

      <div className="relative" ref={containerRef}>
        <AnimatePresence>
          {hovered && (
            <motion.div
              animate={{
                top: hovered.top,
                height: hovered.height,
                opacity: 1,
              }}
              className="absolute -inset-x-3 rounded-xl bg-accent/50"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="hover-plate"
              transition={{
                top: { type: "spring", stiffness: 400, damping: 30 },
                height: { type: "spring", stiffness: 400, damping: 30 },
                opacity: { duration: 0.2, ease: "easeInOut" },
              }}
            />
          )}
        </AnimatePresence>
        <div className="relative flex flex-col gap-4">
          {items.map((item) => (
            <ContentCard
              date={item.meta}
              href={item.href}
              key={item.href}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              title={item.title}
              variant="nav"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContentNav;
