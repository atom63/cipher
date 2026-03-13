import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GridProvider } from "@/contexts/grid-context";
import { PasswordGate } from "@/contexts/password-gate";
import { ThemeProvider } from "@/contexts/theme-context";
import { useDebugMode } from "@/hooks/use-debug-mode";
import { usePageMeta } from "@/hooks/use-page-meta";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useDebugMode();

  const location = useLocation();

  // Scroll to top on route change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only trigger on pathname change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Set default page metadata with structured data
  usePageMeta({
    includeStructuredData: true,
  });

  return (
    <ThemeProvider>
      <PasswordGate>
        <GridProvider>
          <TooltipProvider>
            <motion.div
              animate={{ opacity: 1, filter: "blur(0px)" }}
              className="min-h-screen"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              key={location.pathname}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
            <Toaster position="top-right" />
            {/* <ReactQueryDevtools initialIsOpen={false} /> */}
          </TooltipProvider>
        </GridProvider>
      </PasswordGate>
    </ThemeProvider>
  );
}
