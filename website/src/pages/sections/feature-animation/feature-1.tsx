import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useTokenColors } from "./use-token-color";
import { useVisible } from "./use-visible";

type FlowState = "idle" | "in" | "processing" | "out";

const THEME_DEFS = [
  {
    id: "primary" as const,
    colorVar: "var(--color-brand-primary-500)",
    surface: "var(--color-brand-primary-100)",
    status: "var(--color-success-500)",
    radius: 8,
  },
  {
    id: "secondary" as const,
    colorVar: "var(--color-brand-secondary-500)",
    surface: "var(--color-brand-secondary-100)",
    status: "var(--color-warning-500)",
    radius: 24,
  },
  {
    id: "success" as const,
    colorVar: "var(--color-success-500)",
    surface: "var(--color-success-100)",
    status: "var(--color-danger-500)",
    radius: 0,
  },
];

const PATHS_IN = [
  "M 70 70 C 120 70, 140 120, 180 120",
  "M 70 120 L 180 120",
  "M 70 170 C 120 170, 140 120, 180 120",
];
const PATHS_OUT = [
  "M 220 120 C 260 120, 270 65, 310 65",
  "M 220 120 L 310 120",
  "M 220 120 C 260 120, 270 175, 310 175",
];

export function GenerateAnimation() {
  const { ref, visible } = useVisible();
  const colors = useTokenColors({
    primary: "var(--color-brand-primary-500)",
    secondary: "var(--color-brand-secondary-500)",
    success: "var(--color-success-500)",
  });

  const resolvedThemes = useMemo(
    () =>
      THEME_DEFS.map((t) => ({
        ...t,
        colorHex: colors[t.id] ?? t.colorVar,
      })),
    [colors],
  );

  const [inputIdx, setInputIdx] = useState(0);
  const [outputIdx, setOutputIdx] = useState(0);
  const [flow, setFlow] = useState<FlowState>("idle");

  useEffect(() => {
    let mounted = true;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      while (mounted) {
        await sleep(2000);
        if (!mounted) break;
        setInputIdx((p) => (p + 1) % THEME_DEFS.length);
        await sleep(600);
        if (!mounted) break;
        setFlow("in");
        await sleep(600);
        if (!mounted) break;
        setFlow("processing");
        await sleep(800);
        if (!mounted) break;
        setFlow("out");
        await sleep(300);
        if (!mounted) break;
        setOutputIdx((p) => (p + 1) % THEME_DEFS.length);
        await sleep(500);
        if (!mounted) break;
        setFlow("idle");
      }
    };

    if (visible) run();
    return () => { mounted = false; };
  }, [visible]);

  const input = resolvedThemes[inputIdx]!;
  const output = resolvedThemes[outputIdx]!;

  const inAnim =
    flow === "in" || flow === "processing"
      ? { pathLength: 1, opacity: 1, stroke: input.colorHex }
      : { pathLength: 1, opacity: 0.15, stroke: "var(--border)" };

  const outAnim =
    flow === "out"
      ? { pathLength: 1, opacity: 1, stroke: input.colorHex }
      : { pathLength: 1, opacity: 0.15, stroke: "var(--border)" };

  return (
    <div ref={ref} className="relative size-full overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      <svg viewBox="0 0 400 240" className="relative z-10 size-full">
        {[...PATHS_IN, ...PATHS_OUT].map((d, i) => (
          <path key={`base-${i}`} d={d} fill="none" stroke="var(--border)" strokeWidth="2" strokeLinecap="round" opacity={0.3} />
        ))}

        {PATHS_IN.map((d, i) => (
          <motion.path key={`in-${i}`} d={d} fill="none" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0, opacity: 0 }} animate={inAnim} transition={{ duration: 0.6, ease: "easeInOut" }} />
        ))}

        {PATHS_OUT.map((d, i) => (
          <motion.path key={`out-${i}`} d={d} fill="none" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0, opacity: 0 }} animate={outAnim} transition={{ duration: 0.5, ease: "easeInOut" }} />
        ))}

        <g transform="translate(50, 70)">
          <rect x="-16" y="-16" width="32" height="32" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
          <motion.circle cx="0" cy="0" r="8" animate={{ fill: input.colorHex }} transition={{ duration: 0.4 }} />
        </g>
        <g transform="translate(50, 120)">
          <rect x="-16" y="-16" width="32" height="32" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
          <motion.rect x="-7" y="-7" width="14" height="14" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" animate={{ rx: Math.min(input.radius * 0.4, 7), ry: Math.min(input.radius * 0.4, 7) }} transition={{ duration: 0.4 }} />
        </g>
        <g transform="translate(50, 170)">
          <rect x="-16" y="-16" width="32" height="32" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fill="var(--muted-foreground)" fontSize="13" fontWeight="bold">Aa</text>
        </g>

        <g transform="translate(200, 120)">
          <motion.circle cx="0" cy="0" r="24" fill="none" stroke={input.colorHex} strokeWidth="1.5" animate={{ scale: flow === "processing" ? 1.6 : 1, opacity: flow === "processing" ? [0, 0.5, 0] : 0 }} transition={{ duration: 0.8 }} />
          <motion.rect x="-16" y="-16" width="32" height="32" rx="6" fill="var(--card)" strokeWidth="2" animate={{ stroke: flow === "processing" ? input.colorHex : "var(--border)", rotate: flow === "processing" ? 180 : 0 }} transition={{ duration: 0.8, ease: "anticipate" }} />
          <motion.path d="M0 -8 L0 8 M-8 0 L8 0" strokeWidth="2" strokeLinecap="round" animate={{ stroke: flow === "processing" ? input.colorHex : "var(--muted-foreground)", rotate: flow === "processing" ? -90 : 0 }} transition={{ duration: 0.8, ease: "anticipate" }} />
        </g>

        <g transform="translate(325, 65)">
          <rect x="-15" y="-12" width="70" height="24" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
          <motion.circle cx="-3" cy="0" r="4.5" animate={{ fill: output.colorHex }} transition={{ duration: 0.4 }} />
          <motion.circle cx="11" cy="0" r="4.5" animate={{ fill: output.surface }} transition={{ duration: 0.4 }} />
          <motion.circle cx="25" cy="0" r="4.5" animate={{ fill: output.status }} transition={{ duration: 0.4 }} />
          <circle cx="39" cy="0" r="4.5" fill="var(--muted)" />
        </g>
        <g transform="translate(325, 120)">
          <rect x="-15" y="-12" width="70" height="24" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
          <text x="-6" y="5" fill="var(--foreground)" fontSize="14" fontWeight="bold">Aa</text>
          <text x="16" y="5" fill="var(--muted-foreground)" fontSize="10">Aa</text>
          <text x="35" y="5" fill="var(--muted-foreground)" fontSize="8" opacity="0.5">Aa</text>
        </g>
        <g transform="translate(325, 175)">
          <rect x="-15" y="-12" width="70" height="24" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 2" />
          <motion.rect x="-11" y="-8" width="62" height="16" animate={{ fill: output.colorHex, rx: Math.min(output.radius * 0.5, 8), ry: Math.min(output.radius * 0.5, 8) }} transition={{ duration: 0.4 }} />
          <text x="20" y="3" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">Button</text>
        </g>
      </svg>
    </div>
  );
}
