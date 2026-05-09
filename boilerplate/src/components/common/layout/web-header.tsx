import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { PersonalizeToggle } from '@/components/common/theme/personalize-toggle'
import { ThemeToggle } from '@/components/common/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { AnimatedLogo } from '../icon/cipher/app-logo'
import Container from './container'

const NAV_LINKS = [
  {
    label: 'Boilerplate',
    href: 'https://github.com/atom63/cipher-boilerplate',
    external: true,
  },
  {
    label: 'Preview UI',
    href: '/preview',
    external: false,
  },
]

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

          <div className="flex items-center gap-0.5">
            {/* Desktop nav */}
            <div className="mr-1.5 hidden items-center gap-0.5 sm:flex">
              {NAV_LINKS.map(link =>
                link.external ? (
                  <Button
                    key={link.label}
                    render={
                      // biome-ignore lint/a11y/useAnchorContent: children injected by Base UI render prop
                      <a href={link.href} rel="noopener noreferrer" target="_blank" />
                    }
                    size="sm"
                    variant="ghost"
                  >
                    {link.label}
                  </Button>
                ) : (
                  <Button
                    key={link.label}
                    render={<Link to={link.href} />}
                    size="sm"
                    variant="ghost"
                  >
                    {link.label}
                  </Button>
                )
              )}
            </div>

            <PersonalizeToggle size="icon-sm" />
            <ThemeToggle size="icon-sm" />

            {/* Mobile menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    aria-label="Open menu"
                    className="sm:hidden"
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Menu />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                {NAV_LINKS.map(link =>
                  link.external ? (
                    <DropdownMenuItem
                      key={link.label}
                      render={
                        // biome-ignore lint/a11y/useAnchorContent: children injected by Base UI render prop
                        <a href={link.href} rel="noopener noreferrer" target="_blank" />
                      }
                    >
                      {link.label}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem key={link.label} render={<Link to={link.href} />}>
                      {link.label}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Container>
    </header>
  )
}
