import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { TextTicker } from "@/components/ui/text-ticker";
import type { SectionLink } from "@/contexts/aside-context";
import { cn } from "@/lib/utils";

export interface ContentAsideItemsProps {
  backHref?: string;
  backLabel?: string;
  className?: string;
  sectionLinks?: SectionLink[];
}

function useActiveSectionId(ids: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (ids.length === 0) {
      return;
    }

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "0px 0px -60% 0px", threshold: 0 }
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

function SectionLinks({ links }: { links: SectionLink[] }) {
  const activeId = useActiveSectionId(links.map((s) => s.id));

  return (
    <ul className="flex w-full list-none flex-col gap-2">
      {links.map((s) => (
        <li className="min-w-0" key={s.id}>
          <a
            className={cn(
              "flex w-full items-center overflow-hidden no-underline",
              "!leading-[1.15] text-sm",
              "transition-colors duration-150 ease-out",
              "[@media(hover:hover)]:hover:text-foreground",
              s.id === activeId ? "text-foreground" : "text-muted-foreground/50"
            )}
            href={`#${s.id}`}
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById(s.id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <TextTicker
              animationType="bounce"
              bounceDelay={300}
              bounceSpeed={40}
              marqueeDelay={200}
            >
              {s.label}
            </TextTicker>
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Pure content items for the aside — back link + section links.
 * Renders without any wrapper element; compose inside WebAside or a custom aside.
 */
export function ContentAsideItems({
  className,
  backHref = "/",
  backLabel = "Index",
  sectionLinks = [],
}: ContentAsideItemsProps) {
  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <Link
        className={cn(
          "inline-flex items-center gap-1.5 no-underline",
          "text-muted-foreground text-sm",
          "transition-colors duration-150 ease-out",
          "[@media(hover:hover)]:hover:text-foreground"
        )}
        to={backHref}
      >
        <ArrowLeft className="size-3 shrink-0" />
        {backLabel}
      </Link>

      {sectionLinks.length > 0 && (
        <nav aria-label="On this page">
          <SectionLinks links={sectionLinks} />
        </nav>
      )}
    </div>
  );
}

// Keep old name as alias so existing imports don't break
export { ContentAsideItems as ContentAside };
export type { ContentAsideItemsProps as ContentAsideProps };

export default ContentAsideItems;
