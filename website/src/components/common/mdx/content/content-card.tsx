import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ContentCardProps {
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Post date or metadata
   */
  date: string;
  /**
   * Link destination
   */
  href: string;
  /**
   * Optional icon component (shown on left)
   * @default FileText from lucide-react
   */
  icon?: ReactNode;
  /**
   * Mouse enter handler
   */
  onMouseEnter?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  /**
   * Mouse leave handler
   */
  onMouseLeave?: () => void;
  /**
   * Post title
   */
  title: string;
  /**
   * Optional trailing element (shown on right)
   */
  trailing?: ReactNode;
  /**
   * Layout variant
   * @default "card" - Shows icon on left, title/date stacked
   * @default "nav" - Shows title/date on left, trailing on right
   */
  variant?: "card" | "nav";
}

export function ContentCard({
  title,
  date,
  href,
  icon = <FileText className="size-4" />,
  trailing,
  variant = "card",
  className,
  onMouseEnter,
  onMouseLeave,
}: ContentCardProps) {
  if (variant === "nav") {
    return (
      <Link
        className={cn("group block py-2 no-underline", className)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        to={href}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="mb-1.5 font-medium text-base text-foreground">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm">{date}</p>
          </div>
          {trailing}
        </div>
      </Link>
    );
  }

  return (
    <Link
      className={cn(
        "group flex cursor-pointer items-center gap-3 py-2",
        className
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      to={href}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-card">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-foreground text-sm">{title}</span>
        <span className="text-muted-foreground text-sm">{date}</span>
      </div>
      {trailing}
    </Link>
  );
}

export default ContentCard;
