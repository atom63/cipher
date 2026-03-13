import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: ReactNode;
  className?: string;
  removeTopSpacing?: boolean;
  spacing?: "tight" | "default" | "loose";
}

function Section({
  children,
  className,
  spacing = "default", // 'tight' | 'default' | 'loose'
  removeTopSpacing = true,
}: SectionProps) {
  const spacingClasses = {
    tight: "space-y-4 py-8",
    default: "space-y-6 py-16",
    loose: "space-y-8 py-16 md:py-20",
  };

  return (
    <div
      className={cn(
        spacingClasses[spacing],
        removeTopSpacing && "pt-0 md:pt-0",
        className
      )}
    >
      {children}
    </div>
  );
}

export { Section };
export default Section;
