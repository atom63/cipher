import { cn } from "@/lib/utils";
import { SYMBOL_SVG, WORDMARK_SVG } from "./primitives";

function LogoSymbol() {
  return (
    <g>
      <path d={SYMBOL_SVG.path} fill="currentColor" />
    </g>
  );
}

function LogoWordmark() {
  return (
    <g>
      <path d={WORDMARK_SVG.path} fill="currentColor" />
    </g>
  );
}

interface AppLogoProps {
  className?: string;
  /** Apply --primary color to the symbol mark */
  colored?: boolean;
  height?: number;
  variant?: "horizontal" | "vertical" | "symbol" | "wordmark";
}

export function AppLogo({
  variant = "horizontal",
  height = 32,
  colored = false,
  className,
}: AppLogoProps) {
  const symbolColor = colored ? "text-primary" : undefined;
  switch (variant) {
    case "horizontal": {
      const wordmarkHeight = height * (80 / 120);
      const gap = height / 3;
      return (
        <div
          className={cn("inline-flex items-center", className)}
          style={{ gap }}
        >
          <svg
            className={symbolColor}
            fill="none"
            height={height}
            viewBox={SYMBOL_SVG.viewBox}
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Symbol</title>
            <LogoSymbol />
          </svg>
          <svg
            fill="none"
            height={wordmarkHeight}
            viewBox={WORDMARK_SVG.viewBox}
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Wordmark</title>
            <LogoWordmark />
          </svg>
        </div>
      );
    }

    case "vertical": {
      const symbolSize = height;
      const wordmarkHeight = symbolSize * (80 / 120);
      const gap = height / 4;
      return (
        <div
          className={cn("inline-flex flex-col items-center", className)}
          style={{ gap }}
        >
          <svg
            className={symbolColor}
            fill="none"
            height={symbolSize}
            viewBox={SYMBOL_SVG.viewBox}
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Symbol</title>
            <LogoSymbol />
          </svg>
          <svg
            fill="none"
            height={wordmarkHeight}
            viewBox={WORDMARK_SVG.viewBox}
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Wordmark</title>
            <LogoWordmark />
          </svg>
        </div>
      );
    }

    case "symbol":
      return (
        <svg
          className={cn(symbolColor, className)}
          fill="none"
          height={height}
          viewBox={SYMBOL_SVG.viewBox}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Symbol</title>
          <LogoSymbol />
        </svg>
      );

    case "wordmark":
      return (
        <svg
          className={className}
          fill="none"
          height={height}
          viewBox={WORDMARK_SVG.viewBox}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Wordmark</title>
          <LogoWordmark />
        </svg>
      );

    default:
      return null;
  }
}
