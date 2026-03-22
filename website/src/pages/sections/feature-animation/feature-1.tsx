import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useTokenColors } from "./use-token-color";
import { useVisible } from "./use-visible";

type FlowState = "idle" | "in" | "processing" | "out";

const THEME_DEFS = [
  {
    id: "primary" as const,
    colorVar: "var(--color-b1-500)",
    surface: "var(--color-b1-100)",
    status: "var(--color-success-500)",
    radius: 8,
  },
  {
    id: "secondary" as const,
    colorVar: "var(--color-b2-500)",
    surface: "var(--color-b2-100)",
    status: "var(--color-warning-500)",
    radius: 24,
  },
  {
    id: "success" as const,
    colorVar: "var(--color-success-500)",
    surface: "var(--color-b3-100)",
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
    primary: "var(--color-b1-500)",
    secondary: "var(--color-b2-500)",
    success: "var(--color-success-500)",
  });

  const resolvedThemes = useMemo(
    () =>
      THEME_DEFS.map((t) => ({
        ...t,
        colorHex: colors[t.id] ?? t.colorVar,
      })),
    [colors]
  );

  const [inputIdx, setInputIdx] = useState(0);
  const [outputIdx, setOutputIdx] = useState(0);
  const [flow, setFlow] = useState<FlowState>("idle");

  useEffect(() => {
    let mounted = true;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      while (mounted) {
        await sleep(2500);
        if (!mounted) {
          break;
        }
        setInputIdx((p) => (p + 1) % THEME_DEFS.length);
        await sleep(600);
        if (!mounted) {
          break;
        }
        setFlow("in");
        await sleep(600);
        if (!mounted) {
          break;
        }
        setFlow("processing");
        await sleep(1000);
        if (!mounted) {
          break;
        }
        setFlow("out");
        await sleep(400);
        if (!mounted) {
          break;
        }
        setOutputIdx((p) => (p + 1) % THEME_DEFS.length);
        await sleep(900);
        if (!mounted) {
          break;
        }
        setFlow("idle");
      }
    };

    if (visible) {
      run();
    }
    return () => {
      mounted = false;
    };
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
    <div className="relative size-full overflow-hidden" ref={ref}>
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(var(--border) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      <svg className="relative z-10 h-auto w-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 400 240">
        {[...PATHS_IN, ...PATHS_OUT].map((d, i) => (
          <path
            d={d}
            fill="none"
            key={`base-${i}`}
            opacity={0.3}
            stroke="var(--border)"
            strokeLinecap="round"
            strokeWidth="2"
          />
        ))}

        {PATHS_IN.map((d, i) => (
          <motion.path
            animate={inAnim}
            d={d}
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            key={`in-${i}`}
            strokeLinecap="round"
            strokeWidth="2.5"
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        ))}

        {PATHS_OUT.map((d, i) => (
          <motion.path
            animate={outAnim}
            d={d}
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            key={`out-${i}`}
            strokeLinecap="round"
            strokeWidth="2.5"
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        ))}

        <g transform="translate(50, 70)">
          <rect
            fill="var(--card)"
            height="32"
            rx="8"
            stroke="var(--border)"
            strokeWidth="1.5"
            width="32"
            x="-16"
            y="-16"
          />
          <motion.circle
            animate={{ fill: input.colorHex }}
            cx="0"
            cy="0"
            r="8"
            transition={{ duration: 0.4 }}
          />
        </g>
        <g transform="translate(50, 120)">
          <rect
            fill="var(--card)"
            height="32"
            rx="8"
            stroke="var(--border)"
            strokeWidth="1.5"
            width="32"
            x="-16"
            y="-16"
          />
          <motion.rect
            animate={{
              rx: Math.min(input.radius * 0.4, 7),
              ry: Math.min(input.radius * 0.4, 7),
            }}
            fill="none"
            height="14"
            stroke="var(--muted-foreground)"
            strokeWidth="1.5"
            transition={{ duration: 0.4 }}
            width="14"
            x="-7"
            y="-7"
          />
        </g>
        <g transform="translate(50, 170)">
          <rect
            fill="var(--card)"
            height="32"
            rx="8"
            stroke="var(--border)"
            strokeWidth="1.5"
            width="32"
            x="-16"
            y="-16"
          />
          <text
            fill="var(--muted-foreground)"
            fontSize="13"
            fontWeight="bold"
            textAnchor="middle"
            x="0"
            y="4"
          >
            Aa
          </text>
        </g>

        <g transform="translate(200, 120)">
          <motion.circle
            animate={{
              scale: flow === "processing" ? 1.6 : 1,
              opacity: flow === "processing" ? [0, 0.5, 0] : 0,
            }}
            cx="0"
            cy="0"
            fill="none"
            r="24"
            stroke={input.colorHex}
            strokeWidth="1.5"
            transition={{ duration: 0.8 }}
          />
          <motion.rect
            animate={{
              stroke: flow === "processing" ? input.colorHex : "var(--border)",
              rotate: flow === "processing" ? 180 : 0,
            }}
            fill="var(--card)"
            height="32"
            rx="6"
            strokeWidth="2"
            transition={{ duration: 0.8, ease: "anticipate" }}
            width="32"
            x="-16"
            y="-16"
          />
          <motion.path
            animate={{
              stroke:
                flow === "processing"
                  ? input.colorHex
                  : "var(--muted-foreground)",
              rotate: flow === "processing" ? -90 : 0,
            }}
            d="M0 -8 L0 8 M-8 0 L8 0"
            strokeLinecap="round"
            strokeWidth="2"
            transition={{ duration: 0.8, ease: "anticipate" }}
          />
        </g>

        <g transform="translate(325, 65)">
          <rect
            fill="var(--card)"
            height="24"
            rx="4"
            stroke="var(--border)"
            strokeWidth="1"
            width="70"
            x="-15"
            y="-12"
          />
          <motion.circle
            animate={{ fill: output.colorHex }}
            cx="-3"
            cy="0"
            r="4.5"
            transition={{ duration: 0.4 }}
          />
          <motion.circle
            animate={{ fill: output.surface }}
            cx="11"
            cy="0"
            r="4.5"
            transition={{ duration: 0.4 }}
          />
          <motion.circle
            animate={{ fill: output.status }}
            cx="25"
            cy="0"
            r="4.5"
            transition={{ duration: 0.4 }}
          />
          <circle cx="39" cy="0" fill="var(--muted)" r="4.5" />
        </g>
        <g transform="translate(325, 120)">
          <rect
            fill="var(--card)"
            height="24"
            rx="4"
            stroke="var(--border)"
            strokeWidth="1"
            width="70"
            x="-15"
            y="-12"
          />
          <text
            fill="var(--foreground)"
            fontSize="14"
            fontWeight="bold"
            x="-6"
            y="5"
          >
            Aa
          </text>
          <text fill="var(--muted-foreground)" fontSize="10" x="16" y="5">
            Aa
          </text>
          <text
            fill="var(--muted-foreground)"
            fontSize="8"
            opacity="0.5"
            x="35"
            y="5"
          >
            Aa
          </text>
        </g>
        <g transform="translate(325, 175)">
          <rect
            fill="var(--card)"
            height="24"
            rx="4"
            stroke="var(--border)"
            strokeDasharray="2 2"
            strokeWidth="1"
            width="70"
            x="-15"
            y="-12"
          />
          <motion.rect
            animate={{
              fill: output.colorHex,
              rx: Math.min(output.radius * 0.5, 8),
              ry: Math.min(output.radius * 0.5, 8),
            }}
            height="16"
            transition={{ duration: 0.4 }}
            width="62"
            x="-11"
            y="-8"
          />
          <text
            fill="white"
            fontSize="8"
            fontWeight="bold"
            textAnchor="middle"
            x="20"
            y="3"
          >
            Button
          </text>
        </g>
      </svg>
    </div>
  );
}
