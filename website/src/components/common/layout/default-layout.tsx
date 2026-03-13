import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Page from "./page";
import WebFooter from "./web-footer";
import WebHeader from "./web-header";

interface DefaultLayoutProps {
  children: ReactNode;
  className?: string;
  nav?: "header" | "aside" | "none";
  showFooter?: boolean;
}

export default function DefaultLayout({
  children,
  className,
}: DefaultLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <WebHeader />
      <Page className={cn("flex-1", className)}>{children}</Page>
      <WebFooter />
    </div>
  );
}
