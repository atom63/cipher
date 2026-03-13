import type React from "react";
import { createContext, useContext } from "react";

import { cn } from "@/lib/utils";

const ExampleContext = createContext(false);
export const useIsInsideExample = () => useContext(ExampleContext);

interface ExampleContainerProps {
  align?: "left" | "center";
  children: React.ReactNode;
  className?: string;
  spec?: React.ReactNode;
  /** Use wide layout to break out of narrow prose constraints */
  wide?: boolean;
}

/**
 * ExampleContainer - Component for displaying interactive examples in MDX documentation
 * Used in the Library app to showcase component variants and usage
 *
 * Note: Add titles/descriptions using regular MDX headings/text above the container
 *
 * Uses container queries for responsive layouts within windowed environments.
 * Use @sm:, @md:, @lg: instead of sm:, md:, lg: for responsive classes.
 *
 * Set `wide` to break out of narrow prose constraints (uses figure element).
 */
export function ExampleContainer({
  children,
  align = "center",
  spec,
  className,
  wide = false,
}: ExampleContainerProps) {
  const Wrapper = wide ? "figure" : "div";

  return (
    <Wrapper className="not-prose not-mdx example-container @container my-4">
      {/* Example container */}
      <div
        className={cn(
          "relative grid min-h-80 gap-6 overflow-hidden rounded-xl border border-border bg-background",
          className
        )}
      >
        <div
          className={cn(
            "relative flex items-center p-6",
            "[background-size:20px_20px]",
            "[background-image:radial-gradient(var(--input)_1px,transparent_1px)]"
          )}
        >
          {/* Radial gradient overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center [background:var(--background)] [mask-image:radial-gradient(ellipse_at_center,transparent_1%,black)]" />

          {/* Content — context tells MDX component overrides to skip styling */}
          <ExampleContext.Provider value={true}>
            <div
              className={cn(
                "not-mdx relative z-10 flex w-full flex-wrap gap-8",
                align === "center" && "items-center justify-center",
                align === "left" && "items-start justify-start"
              )}
            >
              {children}
            </div>
          </ExampleContext.Provider>
        </div>

        {/* Optional spec panel */}
        {spec && <div className="w-full overflow-hidden">{spec}</div>}
      </div>
    </Wrapper>
  );
}
