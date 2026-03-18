import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/common/theme/theme-toggle";
import { cn } from "@/lib/utils";
import { AnimatedLogo } from "../icon/cipher/app-logo";
import Container from "./container";

interface WebHeaderProps {
  className?: string;
}

export default function WebHeader({ className }: WebHeaderProps) {
  return (
    <header className={cn("sticky top-0 z-50", className)}>
      <Container maxWidth="narrower" padding="all">
        <div className="flex h-8 items-center justify-between">
          <Link
            className="rounded-sm text-foreground no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            to="/"
          >
            <AnimatedLogo colored height={24} />
          </Link>

          <ThemeToggle size="icon-sm" />
        </div>
      </Container>
    </header>
  );
}
