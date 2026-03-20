import type React from "react";
import { Children, isValidElement, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ExampleContainer,
  useIsInsideExample,
} from "./blocks/example-container";
import { type CalloutType, mdxStyles } from "./mdx-styles";
import { CopyButton } from "./utils/copy-button";

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

// Recursively extract plain text from React children (for copy-to-clipboard)
function extractTextFromChildren(children: ReactNode): string {
  const parts: string[] = [];
  Children.forEach(children, (child) => {
    if (typeof child === "string") {
      parts.push(child);
    } else if (typeof child === "number") {
      parts.push(String(child));
    } else if (isValidElement(child) && child.props) {
      const nested = extractTextFromChildren(
        (child.props as { children?: ReactNode }).children
      );
      if (nested) {
        parts.push(nested);
      }
    }
  });
  return parts.join("");
}

// Helper to check if element should get typography styles
const shouldApplyTypography = (className?: string) => {
  if (!className) {
    return true;
  }
  const skipTypographyClasses = [
    "btn",
    "button",
    "card",
    "alert",
    "badge",
    "input",
    "select",
    "form",
    "nav",
    "menu",
    "dropdown",
    "modal",
    "dialog",
    "tooltip",
    "progress",
    "slider",
    "switch",
    "checkbox",
    "radio",
    "textarea",
    // Component preview containers
    "example-container",
    "component-preview",
    "demo-container",
    // Utility to opt-out
    "not-mdx",
    "no-typography",
  ];
  return !skipTypographyClasses.some((cls) => className.includes(cls));
};

function useShouldApplyTypography(className?: string): boolean {
  const insideExample = useIsInsideExample();
  if (insideExample) {
    return false;
  }
  return shouldApplyTypography(className);
}

/**
 * ============================================================================
 * MDX COMPONENTS - All HTML elements + custom components
 * ============================================================================
 */

export const mdxComponents = {
  // Headings
  h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.headings.h1 : "",
        className
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.headings.h2 : "",
        className
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.headings.h3 : "",
        className
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.headings.h4 : "",
        className
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.headings.h5 : "",
        className
      )}
      {...props}
    />
  ),
  h6: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h6
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.headings.h6 : "",
        className
      )}
      {...props}
    />
  ),

  // Text elements
  p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.text.paragraph : "",
        className
      )}
      {...props}
    />
  ),

  // Content elements
  blockquote: ({
    className,
    ...props
  }: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.blockquote : "",
        className
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }: React.ComponentPropsWithoutRef<"code">) => {
    const shouldStyle = useShouldApplyTypography(className);
    const isInline = !className?.includes("language-");
    if (isInline) {
      return (
        <code
          className={cn(
            shouldStyle ? mdxStyles.content.inlineCode : "",
            className
          )}
          {...props}
        />
      );
    }
    return (
      <code className={cn(mdxStyles.content.code, className)} {...props} />
    );
  },
  pre: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLPreElement>) => {
    const codeText = extractTextFromChildren(children);
    return (
      <div className="group/code relative">
        {codeText && <CopyButton text={codeText} />}
        <pre className={cn(mdxStyles.content.pre, className)} {...props}>
          {children}
        </pre>
      </div>
    );
  },

  // Lists
  ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.ul : "",
        className
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.ol : "",
        className
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.li : "",
        className
      )}
      {...props}
    />
  ),

  // Links and inline elements
  a: ({ className, ...props }: React.HTMLAttributes<HTMLAnchorElement>) => (
    <a
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.link : "",
        className
      )}
      {...props}
    />
  ),
  strong: ({ className, ...props }: React.ComponentPropsWithoutRef<"strong">) => (
    <strong
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.strong : "",
        className
      )}
      {...props}
    />
  ),
  em: ({ className, ...props }: React.ComponentPropsWithoutRef<"em">) => (
    <em
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.em : "",
        className
      )}
      {...props}
    />
  ),
  kbd: ({ className, ...props }: React.ComponentPropsWithoutRef<"kbd">) => (
    <kbd
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.kbd : "",
        className
      )}
      {...props}
    />
  ),

  // Dividers
  hr: ({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.hr : "",
        className
      )}
      {...props}
    />
  ),

  // Tables
  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className={mdxStyles.content.tableWrapper}>
      <Table className={cn(mdxStyles.content.table, className)} {...props} />
    </div>
  ),
  thead: ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <TableHeader
      className={cn(mdxStyles.content.thead, className)}
      {...props}
    />
  ),
  tbody: ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <TableBody className={cn(mdxStyles.content.tbody, className)} {...props} />
  ),
  tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <TableRow className={cn(mdxStyles.content.tr, className)} {...props} />
  ),
  th: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <TableHead className={cn(mdxStyles.content.th, className)} {...props} />
  ),
  td: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <TableCell className={cn(mdxStyles.content.td, className)} {...props} />
  ),
  caption: ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLTableCaptionElement>) => (
    <TableCaption
      className={cn(mdxStyles.content.caption, className)}
      {...props}
    />
  ),

  // Media elements
  img: ({
    className,
    alt,
    src,
    width,
    height,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
      alt={alt}
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.img : "",
        className
      )}
      height={height}
      src={src}
      width={width}
      {...props}
    />
  ),
  figure: ({ className, ...props }: React.ComponentPropsWithoutRef<"figure">) => (
    <figure
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.figure : "",
        className
      )}
      {...props}
    />
  ),
  figcaption: ({
    className,
    ...props
  }: React.ComponentPropsWithoutRef<"figcaption">) => (
    <figcaption
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.figcaption : "",
        className
      )}
      {...props}
    />
  ),
  iframe: ({
    className,
    ...props
  }: React.IframeHTMLAttributes<HTMLIFrameElement>) => (
    <iframe
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.iframe : "",
        className
      )}
      {...props}
    />
  ),
  video: ({
    className,
    ...props
  }: React.VideoHTMLAttributes<HTMLVideoElement>) => (
    <video
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.video : "",
        className
      )}
      {...props}
    />
  ),
  audio: ({
    className,
    ...props
  }: React.AudioHTMLAttributes<HTMLAudioElement>) => (
    <audio
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.audio : "",
        className
      )}
      {...props}
    />
  ),

  // Interactive elements
  details: ({
    className,
    ...props
  }: React.ComponentPropsWithoutRef<"details">) => (
    <details
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.details : "",
        className
      )}
      {...props}
    />
  ),
  summary: ({
    className,
    ...props
  }: React.ComponentPropsWithoutRef<"summary">) => (
    <summary
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.summary : "",
        className
      )}
      {...props}
    />
  ),

  // Text formatting elements
  mark: ({ className, ...props }: React.ComponentPropsWithoutRef<"mark">) => (
    <mark
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.mark : "",
        className
      )}
      {...props}
    />
  ),
  del: ({ className, ...props }: React.ComponentPropsWithoutRef<"del">) => (
    <del
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.del : "",
        className
      )}
      {...props}
    />
  ),
  ins: ({ className, ...props }: React.ComponentPropsWithoutRef<"ins">) => (
    <ins
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.ins : "",
        className
      )}
      {...props}
    />
  ),
  sub: ({ className, ...props }: React.ComponentPropsWithoutRef<"sub">) => (
    <sub
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.sub : "",
        className
      )}
      {...props}
    />
  ),
  sup: ({ className, ...props }: React.ComponentPropsWithoutRef<"sup">) => (
    <sup
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.sup : "",
        className
      )}
      {...props}
    />
  ),

  // Semantic elements
  abbr: ({ className, ...props }: React.ComponentPropsWithoutRef<"abbr">) => (
    <abbr
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.abbr : "",
        className
      )}
      {...props}
    />
  ),
  cite: ({ className, ...props }: React.ComponentPropsWithoutRef<"cite">) => (
    <cite
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.cite : "",
        className
      )}
      {...props}
    />
  ),
  dfn: ({ className, ...props }: React.ComponentPropsWithoutRef<"dfn">) => (
    <dfn
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.dfn : "",
        className
      )}
      {...props}
    />
  ),
  time: ({ className, ...props }: React.ComponentPropsWithoutRef<"time">) => (
    <time
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.time : "",
        className
      )}
      {...props}
    />
  ),
  var: ({ className, ...props }: React.ComponentPropsWithoutRef<"var">) => (
    <var
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.var : "",
        className
      )}
      {...props}
    />
  ),
  samp: ({ className, ...props }: React.ComponentPropsWithoutRef<"samp">) => (
    <samp
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.samp : "",
        className
      )}
      {...props}
    />
  ),
  output: ({
    className,
    ...props
  }: React.ComponentPropsWithoutRef<"output">) => (
    <output
      className={cn(
        useShouldApplyTypography(className) ? mdxStyles.content.output : "",
        className
      )}
      {...props}
    />
  ),

  // Custom MDX components
  Callout: ({
    children,
    type = "info",
  }: {
    children: React.ReactNode;
    type?: CalloutType;
  }) => (
    <div
      className={cn(
        "callout",
        mdxStyles.layout.callout.base,
        mdxStyles.layout.callout[type]
      )}
    >
      {children}
    </div>
  ),

  ImageGrid: ({ children }: { children: React.ReactNode }) => (
    <div className="my-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  ),

  // Component library components
  ExampleContainer,
};
