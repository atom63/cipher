import { useMemo } from "react";

const RGBA_RE = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/;
const VAR_RE = /^var\((.+)\)$/;

/**
 * Converts an rgba() string to a short hex (#RRGGBB) string.
 * Falls through if the input isn't rgba().
 */
function rgbaToHex(rgba: string): string {
  const m = rgba.match(RGBA_RE);
  if (!m) {
    return rgba;
  }
  const r = Math.round(Number(m[1]));
  const g = Math.round(Number(m[2]));
  const b = Math.round(Number(m[3]));
  const hex = (r * 65_536 + g * 256 + b).toString(16).padStart(6, "0");
  return `#${hex.toUpperCase()}`;
}

/**
 * Resolves CSS custom property values to hex color strings
 * that framer-motion can interpolate in SVG animations.
 *
 * CSS vars like `var(--primary)` can't be animated between different
 * colors by motion — the browser needs concrete values for interpolation.
 * This hook reads the computed values once and converts rgba → hex so
 * animated text displays clean short values like #EB8700 instead of
 * rgba(235, 135, 0, 1).
 */
export function useTokenColors<T extends Record<string, string>>(vars: T): T {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return vars;
    }
    const style = getComputedStyle(document.documentElement);
    const resolved = {} as Record<string, string>;
    for (const [key, cssVar] of Object.entries(vars)) {
      const match = cssVar.match(VAR_RE);
      if (match) {
        const varName = match[1];
        const val = (varName ? style.getPropertyValue(varName) : "").trim();
        resolved[key] = val ? rgbaToHex(val) : cssVar;
      } else {
        resolved[key] = cssVar;
      }
    }
    return resolved as T;
  }, [vars]);
}
