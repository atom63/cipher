import { socialsByName } from '@/config/links'
import { cn } from '@/lib/utils'
import Container from './container'

interface FooterProps {
  className?: string
}

const linkClass =
  'rounded-sm text-muted-foreground/50 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function WebFooter({ className }: FooterProps) {
  const currentYear = new Date().getFullYear()
  const website = socialsByName.website
  const githubRepo = socialsByName['github repo']
  const email = socialsByName.email

  return (
    <footer className={cn('', className)}>
      <Container maxWidth="narrow" padding="all">
        <div className="flex flex-wrap items-center justify-between gap-4 py-2 text-muted-foreground/50 text-xs">
          <span>
            © {currentYear} Cipher · Made by{' '}
            <a className={linkClass} href={website?.url} rel="noopener noreferrer" target="_blank">
              You Zhang
            </a>
          </span>
          <nav className="flex items-center gap-4">
            {githubRepo && (
              <a
                className={linkClass}
                href={githubRepo.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                GitHub
              </a>
            )}
            {email && (
              <a className={linkClass} href={email.url}>
                Contact
              </a>
            )}
          </nav>
        </div>
      </Container>
    </footer>
  )
}

export default WebFooter
