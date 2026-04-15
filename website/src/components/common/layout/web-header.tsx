import { Link } from '@tanstack/react-router'
import { PersonalizeToggle } from '@/components/common/theme/personalize-toggle'
import { ThemeToggle } from '@/components/common/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AnimatedLogo } from '../icon/cipher/app-logo'
import Container from './container'

interface WebHeaderProps {
  className?: string
}

export default function WebHeader({ className }: WebHeaderProps) {
  return (
    <header className={cn('sticky top-0 z-50', className)}>
      <Container maxWidth="narrow" padding="all">
        <div className="flex h-8 items-center justify-between">
          <Link
            className="rounded-sm text-foreground no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            to="/"
          >
            <AnimatedLogo colored height={24} />
          </Link>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost">
              <a
                href="https://github.com/atom63/cipher-boilerplate"
                rel="noopener noreferrer"
                target="_blank"
              >
                Boilerplate
              </a>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to="/preview">Preview UI</Link>
            </Button>
            <div className="flex items-center gap-0.5">
              <PersonalizeToggle size="icon-sm" />
              <ThemeToggle size="icon-sm" />
            </div>
          </div>
        </div>
      </Container>
    </header>
  )
}
