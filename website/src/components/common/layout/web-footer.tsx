import { cn } from "@/lib/utils";
import Container from "./container";

interface FooterProps {
  className?: string;
}

export function WebFooter({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn("", className)}>
      <Container padding="all">
        <small className="text-muted-foreground">© {currentYear} Brand</small>
      </Container>
    </footer>
  );
}

export default WebFooter;
