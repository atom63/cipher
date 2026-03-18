import { lazy, Suspense, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import Page from "./page";
import WebFooter from "./web-footer";
import WebHeader from "./web-header";

const Dither = lazy(() => import("@/components/vendor/dither/Dither"));

interface DefaultLayoutProps {
  children: ReactNode;
  className?: string;
  nav?: "header" | "aside" | "none";
  noPadding?: boolean;
  showFooter?: boolean;
}

export default function DefaultLayout({
  children,
  className,
  noPadding = false,
  showFooter = true,
}: DefaultLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none fixed inset-0 z-[-1] invert mix-blend-overlay dark:invert-0">
        <Suspense fallback={null}>
          <Dither
            waveColor={[0.5, 0.5, 0.5]}
            disableAnimation={false}
            enableMouseInteraction
            colorNum={3}
            waveAmplitude={0.45}
            waveFrequency={2}
            waveSpeed={0.02}
            opacity={0.5}
            fadeDuration={3000}
          />
        </Suspense>
      </div>
      <WebHeader />
      <Page className={cn("isolate flex-1", className)} noPadding={noPadding}>
        {children}
      </Page>
      {showFooter && <WebFooter />}
    </div>
  );
}
