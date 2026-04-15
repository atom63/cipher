import DefaultLayout from '@/components/common/layout/default-layout'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { BoilerplateSection } from './sections/boilerplate-section'
import { CodeSection } from './sections/code-section'
import { CtaSection } from './sections/cta-section'
import { FaqSection } from './sections/faq-section'
import { FeaturesSection } from './sections/features-section'
import { HeroSection } from './sections/hero-section'

export default function Home() {
  const reduced = useReducedMotion()

  usePageMeta({
    title: 'A token system that aligns design and code',
    description:
      'Cipher is a local-first Figma plugin for generating, updating, managing, and round-tripping structured design tokens across design and implementation workflows.',
    ogTitle: 'Cipher — A token system that aligns design and code',
    ogDescription:
      'Generate, update, manage, and round-trip structured tokens through an opinionated workflow. Free during beta, local-only, ready for modern CSS workflows.',
    keywords: [
      'design tokens',
      'figma plugin',
      'css variables',
      'design system',
      'tailwind css v4',
      'design to code',
      'token export',
      'shadcn ui',
    ],
  })

  return (
    <DefaultLayout noPadding>
      <HeroSection />
      <FeaturesSection />
      <CodeSection reduced={reduced} />
      <BoilerplateSection />
      <FaqSection />
      <CtaSection />
    </DefaultLayout>
  )
}
