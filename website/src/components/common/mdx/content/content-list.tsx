import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ContentCard } from "./content-card";

export interface ContentListItem {
  /**
   * Post date or metadata
   */
  date: string;
  /**
   * Link destination
   */
  href: string;
  /**
   * Optional icon
   */
  icon?: ReactNode;
  /**
   * Unique key for the item
   */
  key: string;
  /**
   * Post title
   */
  title: string;
}

export interface ContentListProps {
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Array of content items to display
   */
  items: ContentListItem[];
  /**
   * Enable hover plate effect
   * @default false
   */
  withHoverPlate?: boolean;
}

export function ContentList({
  items,
  className,
  withHoverPlate = false,
}: ContentListProps) {
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
    if (!withHoverPlate) {
      return;
    }

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
    if (!withHoverPlate) {
      return;
    }
    leaveTimer.current = setTimeout(() => setHovered(null), 150);
  };

  if (!withHoverPlate) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        {items.map((item) => (
          <ContentCard
            date={item.date}
            href={item.href}
            icon={item.icon}
            key={item.key}
            title={item.title}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} ref={containerRef}>
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
            date={item.date}
            href={item.href}
            icon={item.icon}
            key={item.key}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            title={item.title}
          />
        ))}
      </div>
    </div>
  );
}

export default ContentList;
