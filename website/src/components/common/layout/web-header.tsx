import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/common/theme/theme-toggle";
import { AppLogo } from "../icon/a63/app-logo";
import Container from "./container";

interface WebHeaderProps {
  className?: string;
}

export default function WebHeader({ className }: WebHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-50 bg-background/90 backdrop-blur-sm ${className || ""}`}
    >
      <Container padding="all">
        <div className="flex h-8 items-center justify-between">
          <Link
            className="text-foreground no-underline transition-colors"
            to="/"
          >
            <AppLogo variant="symbol" />
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              activeProps={{ className: "text-foreground" }}
              className="text-muted-foreground text-sm no-underline transition-colors hover:text-foreground"
              to="/"
            >
              Home
            </Link>
            <Link
              activeProps={{ className: "text-foreground" }}
              className="text-muted-foreground text-sm no-underline transition-colors hover:text-foreground"
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
