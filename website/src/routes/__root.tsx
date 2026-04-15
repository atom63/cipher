import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { lazy, Suspense, useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PersonalizationProvider } from '@/contexts/personalization-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { usePageMeta } from '@/hooks/use-page-meta'

const Dither = lazy(() => import('@/components/vendor/dither/Dither'))

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const location = useLocation()

  // Scroll to top on route change, then to section if requested via state
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only trigger on pathname change
  useEffect(() => {
    window.scrollTo(0, 0)

    const scrollTarget = (location.state as { scrollTo?: string })?.scrollTo
    if (scrollTarget) {
      // Wait for entrance animation to finish, then smooth-scroll to section
      const timer = setTimeout(() => {
        const el = document.getElementById(scrollTarget)
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 80
          window.scrollTo({ top, behavior: 'smooth' })
        }
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [location.pathname, location.state])

  // Set default page metadata with structured data
  usePageMeta({
    includeStructuredData: true,
  })

  return (
    <ThemeProvider>
      <PersonalizationProvider>
        <RootInner location={location} />
      </PersonalizationProvider>
    </ThemeProvider>
  )
}

function RootInner({ location }: { location: ReturnType<typeof useLocation> }) {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[-1] mix-blend-overlay invert dark:invert-0">
        <Suspense fallback={null}>
          <Dither
            colorNum={3}
            disableAnimation={false}
            enableMouseInteraction
            opacity={0.5}
            waveAmplitude={0.45}
            waveColor={[0.5, 0.5, 0.5]}
            waveFrequency={2}
            waveSpeed={0.02}
          />
        </Suspense>
      </div>
      <TooltipProvider>
        <motion.div
          animate={{ opacity: 1 }}
          className="min-h-screen"
          initial={{ opacity: 0 }}
          key={location.pathname}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
        <Toaster position="top-right" />
      </TooltipProvider>
    </>
  )
}
