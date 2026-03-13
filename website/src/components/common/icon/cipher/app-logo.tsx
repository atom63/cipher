import { cn } from "@/lib/utils";
import {
  SYMBOL_L_SVG,
  SYMBOL_R_SVG,
  SYMBOL_SVG,
  WORDMARK_SVG,
} from "./primitives";

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

interface AnimatedSymbolProps {
  className?: string;
  colored?: boolean;
  height?: number;
}

export function AnimatedSymbol({
  height = 80,
  colored = false,
  className,
}: AnimatedSymbolProps) {
  const symbolColor = colored ? "text-primary" : undefined;
  const halfWidth = height * (43 / 80);
  const gap = height * (4 / 80);
  const shift = halfWidth + gap;

  return (
    <>
      <style>{`
        @keyframes cipher-l {
          0%   { translate: 0; animation-timing-function: cubic-bezier(0.16,1,0.3,1) }
          50%  { translate: var(--symbol-shift); animation-timing-function: cubic-bezier(0.16,1,0.3,1) }
          100% { translate: 0 }
        }
        @keyframes cipher-r {
          0%   { translate: 0; animation-timing-function: cubic-bezier(0.16,1,0.3,1) }
          50%  { translate: calc(var(--symbol-shift) * -1); animation-timing-function: cubic-bezier(0.16,1,0.3,1) }
          100% { translate: 0 }
        }
        @keyframes cipher-spin {
          0%   { rotate: 0deg }
          50%  { rotate: 0deg; animation-timing-function: cubic-bezier(0.16,1,0.3,1) }
          100% { rotate: 180deg }
        }
      `}</style>
      <div
        className={cn("group inline-flex items-center", symbolColor, className)}
        style={{ gap, "--symbol-shift": `${shift}px` } as React.CSSProperties}
      >
        <div
          className="inline-flex items-center group-hover:animate-[cipher-spin_1.5s_linear_forwards]"
          style={{ gap }}
        >
          <svg
            className="group-hover:animate-[cipher-l_1.5s_linear_forwards]"
            fill="none"
            height={height}
            viewBox={SYMBOL_L_SVG.viewBox}
            width={halfWidth}
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Symbol Left</title>
            <path d={SYMBOL_L_SVG.path} fill="currentColor" />
          </svg>
          <svg
            className="group-hover:animate-[cipher-r_1.5s_linear_forwards]"
            fill="none"
            height={height}
            viewBox={SYMBOL_R_SVG.viewBox}
            width={halfWidth}
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Symbol Right</title>
            <path d={SYMBOL_R_SVG.path} fill="currentColor" />
          </svg>
        </div>
      </div>
    </>
  );
}

interface AnimatedLogoProps {
  className?: string;
  colored?: boolean;
  height?: number;
}

export function AnimatedLogo({
  height = 32,
  colored = false,
  className,
}: AnimatedLogoProps) {
  const symbolColor = colored ? "text-primary" : undefined;
  const halfWidth = height * (43 / 80);
  const symbolGap = height * (4 / 80);
  const shift = halfWidth + symbolGap;
  const wordmarkHeight = height * (80 / 120);
  const logoGap = height / 3;

  return (
    <>
      <style>{`
        @keyframes cipher-l {
          0%   { translate: 0; animation-timing-function: cubic-bezier(0.16,1,0.3,1) }
          50%  { translate: var(--symbol-shift); animation-timing-function: cubic-bezier(0.16,1,0.3,1) }
          100% { translate: 0 }
        }
        @keyframes cipher-r {
          0%   { translate: 0; animation-timing-function: cubic-bezier(0.16,1,0.3,1) }
          50%  { translate: calc(var(--symbol-shift) * -1); animation-timing-function: cubic-bezier(0.16,1,0.3,1) }
          100% { translate: 0 }
        }
        @keyframes cipher-spin {
          0%   { rotate: 0deg }
          50%  { rotate: 0deg; animation-timing-function: cubic-bezier(0.16,1,0.3,1) }
          100% { rotate: 180deg }
        }
      `}</style>
      <div
        className={cn("group inline-flex items-center", className)}
        style={
          {
            gap: logoGap,
            "--symbol-shift": `${shift}px`,
          } as React.CSSProperties
        }
      >
        <div
          className="inline-flex items-center group-hover:animate-[cipher-spin_1.5s_linear_forwards]"
          style={{ gap: symbolGap }}
        >
          <svg
            className={cn(
              symbolColor,
              "group-hover:animate-[cipher-l_1.5s_linear_forwards]"
            )}
            fill="none"
            height={height}
            viewBox={SYMBOL_L_SVG.viewBox}
            width={halfWidth}
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Symbol Left</title>
            <path d={SYMBOL_L_SVG.path} fill="currentColor" />
          </svg>
          <svg
            className={cn(
              symbolColor,
              "group-hover:animate-[cipher-r_1.5s_linear_forwards]"
            )}
            fill="none"
            height={height}
            viewBox={SYMBOL_R_SVG.viewBox}
            width={halfWidth}
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Symbol Right</title>
            <path d={SYMBOL_R_SVG.path} fill="currentColor" />
          </svg>
        </div>
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
    </>
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
      const wordmarkHeight = height * 0.35;
      const gap = height * 0.3;
      return (
        <div
          className={cn("inline-flex flex-col items-center", className)}
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
