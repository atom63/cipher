import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/common/theme/theme-toggle";
import { cn } from "@/lib/utils";
import { AnimatedLogo } from "../icon/cipher/app-logo";
import Container from "./container";

interface WebHeaderProps {
  className?: string;
}

const navLinkClass =
  "rounded-sm px-1 py-0.5 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function WebHeader({ className }: WebHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-background/90 backdrop-blur-sm",
        className
      )}
    >
      <Container padding="all">
        <div className="flex h-8 items-center justify-between">
          <Link
            className="rounded-sm text-foreground no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            to="/"
          >
            <AnimatedLogo colored height={24} />
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              activeProps={{ className: "text-foreground" }}
              className={navLinkClass}
              to="/"
            >
              Home
            </Link>
            <Link
              activeProps={{ className: "text-foreground" }}
              className={navLinkClass}
              to="/components"
            >
              Design System
            </Link>
            <ThemeToggle size="icon-sm" />
          </nav>
        </div>
      </Container>
    </header>
  );
}
