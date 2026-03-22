import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useTokenColors } from "./use-token-color";
import { useVisible } from "./use-visible";

type Flow = "none" | "l-r" | "r-l";

export function RoundTripAnimation() {
  const { ref, visible } = useVisible();
  const c = useTokenColors({
    primary: "var(--color-b1-500)",
    secondary: "var(--color-b2-500)",
    success: "var(--color-success-500)",
    danger: "var(--color-danger-500)",
  });

  const colorSteps = useMemo(
    () => [
      { initiator: "code" as const, color: c.success },
      { initiator: "design" as const, color: c.primary },
    ],
    [c],
  );

  const [designColor, setDesignColor] = useState(c.primary);
  const [codeColor, setCodeColor] = useState(c.primary);
  const [editingDesign, setEditingDesign] = useState(false);
  const [editingCode, setEditingCode] = useState(false);
  const [flow, setFlow] = useState<Flow>("none");

  useEffect(() => {
    let mounted = true;
    let step = 0;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      while (mounted) {
        const current = colorSteps[step % colorSteps.length]!;

        await sleep(1600);
        if (!mounted) {
          break;
        }

        if (current.initiator === "code") {
          setEditingCode(true);
          await sleep(600);
          if (!mounted) {
            break;
          }
          setCodeColor(current.color);
          await sleep(400);
          setEditingCode(false);
          setFlow("r-l");
          await sleep(600);
          if (!mounted) {
            break;
          }
          setDesignColor(current.color);
          await sleep(300);
          setFlow("none");
        } else {
          setEditingDesign(true);
          await sleep(600);
          if (!mounted) {
            break;
          }
          setDesignColor(current.color);
          await sleep(400);
          setEditingDesign(false);
          setFlow("l-r");
          await sleep(600);
          if (!mounted) {
            break;
          }
          setCodeColor(current.color);
          await sleep(300);
          setFlow("none");
        }

        step++;
      }
    };

    if (visible) {
      run();
    }
    return () => {
      mounted = false;
    };
  }, [visible, colorSteps]);

  return (
    <div className="relative size-full overflow-hidden" ref={ref}>
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(var(--border) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          backgroundPosition: "center",
        }}
      />

      <svg
        className="relative z-10 h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 400 240"
      >
        {/* LEFT: Design panel */}
        <rect
          fill="var(--card)"
          height="180"
          rx="12"
          stroke="var(--border)"
          strokeWidth="1.5"
          width="150"
          x="20"
          y="30"
        />

        <text
          fill="var(--foreground)"
          fontSize="12"
          fontWeight="600"
          x="36"
          y="54"
        >
          Figma
        </text>
        <path d="M 20 68 L 170 68" stroke="var(--border)" strokeWidth="1" />

        {/* Design token row 1 — dynamic */}
        <motion.rect
          animate={{
            fill: editingDesign ? "rgba(235, 135, 0, 0.08)" : "transparent",
          }}
          height="26"
          rx="6"
          transition={{ duration: 0.3 }}
          width="134"
          x="28"
          y="87"
        />
        <motion.circle
          animate={{ scale: 1 }}
          cx="43"
          cy="100"
          fill={designColor}
          initial={{ scale: 0.5 }}
          key={`d-${designColor}`}
          r="7"
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        />
        <text
          fill="var(--foreground)"
          fontFamily="var(--font-family-mono)"
          fontSize="11"
          x="58"
          y="104"
        >
          primary
        </text>

        {/* Design token row 2 — static */}
        <circle
          cx="43"
          cy="132"
          fill="var(--surface-light-2)"
          r="7"
          stroke="var(--border)"
          strokeWidth="1"
        />
        <text
          fill="var(--muted-foreground)"
          fontFamily="var(--font-family-mono)"
          fontSize="11"
          x="58"
          y="136"
        >
          surface
        </text>

        {/* Design token row 3 — static */}
        <circle
          cx="43"
          cy="164"
          fill="var(--surface-light-12)"
          r="7"
          stroke="var(--border)"
          strokeWidth="1"
        />
        <text
          fill="var(--muted-foreground)"
          fontFamily="var(--font-family-mono)"
          fontSize="11"
          x="58"
          y="168"
        >
          text
        </text>

        {/* RIGHT: Code panel */}
        <defs>
          <clipPath id="code-panel-clip">
            <rect height="180" rx="12" width="150" x="230" y="30" />
          </clipPath>
        </defs>
        <rect
          fill="var(--card)"
          height="180"
          rx="12"
          stroke="var(--border)"
          strokeWidth="1.5"
          width="150"
          x="230"
          y="30"
        />

        <g clipPath="url(#code-panel-clip)">
          <text
            fill="var(--foreground)"
            fontSize="12"
            fontWeight="600"
            x="246"
            y="54"
          >
            semantics.css
          </text>
          <path d="M 230 68 L 380 68" stroke="var(--border)" strokeWidth="1" />

          {/* Code content — shifted down 8px for balanced spacing */}
          <text
            fill="var(--muted-foreground)"
            fontFamily="var(--font-family-mono)"
            fontSize="10"
            x="246"
            y="92"
          >
            {":"}
          </text>
          <text
            fill="var(--muted-foreground)"
            fontFamily="var(--font-family-mono)"
            fontSize="10"
            x="252"
            y="92"
          >
            root {"{"}
          </text>

          <motion.rect
            animate={{
              fill: editingCode ? "rgba(235, 135, 0, 0.08)" : "transparent",
            }}
            height="20"
            rx="4"
            width="134"
            x="238"
            y="99"
          />
          <text
            fill="var(--primary)"
            fontFamily="var(--font-family-mono)"
            fontSize="10"
            x="250"
            y="112"
          >
            --primary:{" "}
          </text>

          <motion.text
            animate={{ fill: codeColor }}
            fontFamily="var(--font-family-mono)"
            fontSize="10"
            initial={{ fill: "var(--foreground)" }}
            key={`c-${codeColor}`}
            transition={{ duration: 0.4 }}
            x="318"
            y="112"
          >
            {codeColor}
          </motion.text>

          {/* Blinking cursor */}
          <motion.rect
            animate={{ opacity: editingCode ? [1, 0] : 0 }}
            fill="var(--primary)"
            height="11"
            initial={{ opacity: 0 }}
            transition={{
              repeat: editingCode ? Number.POSITIVE_INFINITY : 0,
              duration: 0.4,
            }}
            width="2"
            x="368"
            y="103"
          />

          <text
            fill="var(--primary)"
            fontFamily="var(--font-family-mono)"
            fontSize="10"
            x="250"
            y="136"
          >
            --surface:{" "}
          </text>
          <text
            fill="var(--muted-foreground)"
            fontFamily="var(--font-family-mono)"
            fontSize="10"
            x="318"
            y="136"
          >
            #F9F9F9
          </text>

          <text
            fill="var(--primary)"
            fontFamily="var(--font-family-mono)"
            fontSize="10"
            x="250"
            y="160"
          >
            --text:{" "}
          </text>
          <text
            fill="var(--muted-foreground)"
            fontFamily="var(--font-family-mono)"
            fontSize="10"
            x="318"
            y="160"
          >
            #202020
          </text>

          <text
            fill="var(--muted-foreground)"
            fontFamily="var(--font-family-mono)"
            fontSize="10"
            x="246"
            y="176"
          >
            {"}"}
          </text>
        </g>

        {/* CENTER: Sync bridges */}
        {/* Export path L→R */}
        <path
          d="M 170 100 L 230 100"
          stroke="var(--border)"
          strokeDasharray="4 4"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <motion.path
          animate={{
            pathLength: flow === "l-r" ? 1 : 0,
            opacity: flow === "l-r" ? [0, 1, 1, 0] : 0,
          }}
          d="M 170 100 L 230 100"
          initial={{ pathLength: 0, opacity: 0 }}
          stroke={designColor}
          strokeLinecap="round"
          strokeWidth="2.5"
          transition={{
            pathLength: {
              duration: flow === "l-r" ? 0.7 : 0,
              ease: "easeInOut",
            },
            opacity: {
              duration: flow === "l-r" ? 0.7 : 0,
              times: [0, 0.1, 0.8, 1],
            },
          }}
        />
        <motion.circle
          animate={{
            cx: flow === "l-r" ? 230 : 170,
            opacity: flow === "l-r" ? [0, 1, 1, 0] : 0,
          }}
          cy="100"
          fill={designColor}
          initial={{ cx: 170, opacity: 0 }}
          r="4.5"
          transition={{
            cx: { duration: flow === "l-r" ? 0.7 : 0, ease: "easeInOut" },
            opacity: {
              duration: flow === "l-r" ? 0.7 : 0,
              times: [0, 0.1, 0.8, 1],
            },
          }}
        />

        {/* Import path R→L */}
        <path
          d="M 230 156 L 170 156"
          stroke="var(--border)"
          strokeDasharray="4 4"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <motion.path
          animate={{
            pathLength: flow === "r-l" ? 1 : 0,
            opacity: flow === "r-l" ? [0, 1, 1, 0] : 0,
          }}
          d="M 230 156 L 170 156"
          initial={{ pathLength: 0, opacity: 0 }}
          stroke={codeColor}
          strokeLinecap="round"
          strokeWidth="2.5"
          transition={{
            pathLength: {
              duration: flow === "r-l" ? 0.7 : 0,
              ease: "easeInOut",
            },
            opacity: {
              duration: flow === "r-l" ? 0.7 : 0,
              times: [0, 0.1, 0.8, 1],
            },
          }}
        />
        <motion.circle
          animate={{
            cx: flow === "r-l" ? 170 : 230,
            opacity: flow === "r-l" ? [0, 1, 1, 0] : 0,
          }}
          cy="156"
          fill={codeColor}
          initial={{ cx: 230, opacity: 0 }}
          r="4.5"
          transition={{
            cx: { duration: flow === "r-l" ? 0.7 : 0, ease: "easeInOut" },
            opacity: {
              duration: flow === "r-l" ? 0.7 : 0,
              times: [0, 0.1, 0.8, 1],
            },
          }}
        />
      </svg>
    </div>
  );
}
