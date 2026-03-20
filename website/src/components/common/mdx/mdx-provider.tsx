import { MDXProvider } from "@mdx-js/react";
import type { MDXComponents } from "mdx/types";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { mdxComponents } from "./mdx-components";
import { mdxStyles } from "./mdx-styles";

/**
 * Prose variants for MDX content width control
 * - default: full width, no constraints
 * - narrow: text elements narrowest + centered, media stays full width
 */

// Shared narrow styles for text elements (max-w-xl = 36rem)
const narrowTextElements = [
  // Headings
  "[&>h1]:mx-auto [&>h1]:max-w-xl",
  "[&>h2]:mx-auto [&>h2]:max-w-xl",
  "[&>h3]:mx-auto [&>h3]:max-w-xl",
  "[&>h4]:mx-auto [&>h4]:max-w-xl",
  "[&>h5]:mx-auto [&>h5]:max-w-xl",
  "[&>h6]:mx-auto [&>h6]:max-w-xl",
  // Text
  "[&>p]:mx-auto [&>p]:max-w-xl",
  // Lists
  "[&>ul]:mx-auto [&>ul]:max-w-xl",
  "[&>ol]:mx-auto [&>ol]:max-w-xl",
  "[&>dl]:mx-auto [&>dl]:max-w-xl",
  // Blocks
  "[&>blockquote]:mx-auto [&>blockquote]:max-w-xl",
  "[&>hr]:mx-auto [&>hr]:max-w-xl",
  // Code blocks (rehype-pretty-code wraps in figure)
  "[&>figure[data-rehype-pretty-code-figure]]:mx-auto [&>figure[data-rehype-pretty-code-figure]]:max-w-xl",
  // Generic divs (typography examples, etc.) - figure elements stay full width
  "[&>div]:mx-auto [&>div]:max-w-xl",
  // Details
  "[&>details]:mx-auto [&>details]:max-w-xl",
  // Figcaptions inside full-width figures
  "[&>figure>figcaption]:mx-auto [&>figure>figcaption]:max-w-xl",
  // Let paragraphs containing images break out to full width and inherit media spacing
  "[&>p:has(>img)]:max-w-none [&>p:has(>img)]:my-10 [&>p:has(>img)]:first:mt-0 [&>p:has(>img)]:last:mb-0",
].join(" ");

const proseVariants = {
  default: "",
  // Narrow: text elements constrained, media (figure, img, video) stays full width
  narrow: narrowTextElements,
};

interface MDXContentProviderProps {
  children: React.ReactNode;
  className?: string;
  /** Custom MDX components to override defaults */
  components?: MDXComponents;
  /** Width variant: 'default' for full width, 'narrow' for constrained prose */
  variant?: keyof typeof proseVariants;
}

export const MDXContentProvider = forwardRef<
  HTMLDivElement,
  MDXContentProviderProps
>(function MDXContentProvider(
  { children, className, components, variant = "default" },
  ref,
) {
  const mergedComponents = components
    ? { ...mdxComponents, ...components }
    : mdxComponents;

  return (
    <MDXProvider components={mergedComponents}>
      <div
        className={cn(mdxStyles.root, proseVariants[variant], className)}
        ref={ref}
      >
        {children}
      </div>
    </MDXProvider>
  );
});
