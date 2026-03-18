import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/common/theme/theme-toggle";
import { cn } from "@/lib/utils";
import { AnimatedLogo } from "../icon/cipher/app-logo";
import Container from "./container";

interface WebHeaderProps {
  className?: string;
}

export default function WebHeader({ className }: WebHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);

  const onScroll = useCallback(() => {
    const next = window.scrollY > 8;
    if (next !== scrolledRef.current) {
      scrolledRef.current = next;
      setScrolled(next);
    }
  }, []);

  useEffect(() => {
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[border-color] duration-300 ease-out",
        scrolled
          ? "border-b border-border/40"
          : "border-b border-transparent",
        className,
      )}
    >
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
