import { cn } from "@/lib/utils";
import type { CalloutType } from "../mdx-styles";
import { mdxStyles } from "../mdx-styles";

export interface CalloutProps {
  children: React.ReactNode;
  className?: string;
  type?: CalloutType;
}

/**
 * Callout Component
 * Styled box for highlighting important information
 *
 * Usage:
 * <Callout type="info">This is helpful information</Callout>
 * <Callout type="warning">Be careful!</Callout>
 * <Callout type="error">Something went wrong</Callout>
 * <Callout type="success">Great job!</Callout>
 */
export function Callout({ children, type = "info", className }: CalloutProps) {
  return (
    <div
      className={cn(
        mdxStyles.layout.callout.base,
        mdxStyles.layout.callout[type],
        className
      )}
    >
      {children}
    </div>
  );
}
