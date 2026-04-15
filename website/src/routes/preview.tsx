import { createFileRoute } from '@tanstack/react-router'
import Preview from '@/pages/preview/index'

export const Route = createFileRoute('/preview')({
  component: Preview,
})
