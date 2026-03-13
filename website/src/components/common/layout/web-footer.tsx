import { cn } from "@/lib/utils";
import Container from "./container";

interface FooterProps {
  className?: string;
}

export function WebFooter({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn("border-t border-border/40", className)}>
      <Container padding="all">
        <div className="py-4">
          <small className="text-muted-foreground/60 text-xs">
            © {currentYear} Cipher
          </small>
        </div>
      </Container>
    </footer>
  );
}

export default WebFooter;
