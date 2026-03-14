import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useTokenColors } from "./use-token-color";
import { useVisible } from "./use-visible";

type Flow = "none" | "l-r" | "r-l";

export function RoundTripAnimation() {
  const { ref, visible } = useVisible();
  const c = useTokenColors({
    primary: "var(--color-brand-primary-500)",
    secondary: "var(--color-brand-secondary-500)",
    success: "var(--color-success-500)",
    danger: "var(--color-danger-500)",
  });

  const colorSteps = useMemo(
    () => [
      { initiator: "code" as const, color: c.success },
      { initiator: "design" as const, color: c.primary },
      { initiator: "code" as const, color: c.danger },
      { initiator: "design" as const, color: c.secondary },
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

        await sleep(1500);
        if (!mounted) break;

        if (current.initiator === "code") {
          setEditingCode(true);
          await sleep(800);
          if (!mounted) break;
          setCodeColor(current.color);
          await sleep(500);
          setEditingCode(false);
          setFlow("r-l");
          await sleep(700);
          if (!mounted) break;
          setDesignColor(current.color);
          await sleep(200);
          setFlow("none");
        } else {
          setEditingDesign(true);
          await sleep(800);
          if (!mounted) break;
          setDesignColor(current.color);
          await sleep(500);
          setEditingDesign(false);
          setFlow("l-r");
          await sleep(700);
          if (!mounted) break;
          setCodeColor(current.color);
          await sleep(200);
          setFlow("none");
        }

        step++;
      }
    };

    if (visible) run();
    return () => { mounted = false; };
  }, [visible, colorSteps]);

  return (
    <div ref={ref} className="relative size-full overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          backgroundPosition: "center",
        }}
      />

      <svg viewBox="0 0 400 240" className="relative z-10 size-full">
        {/* LEFT: Design panel */}
        <rect x="20" y="30" width="150" height="180" rx="12" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />

        <text x="36" y="54" fill="var(--foreground)" fontSize="12" fontWeight="600">Figma</text>
        <path d="M 20 68 L 170 68" stroke="var(--border)" strokeWidth="1" />

        {/* Design token row 1 — dynamic */}
        <motion.rect
          x="28" y="87" width="134" height="26" rx="6"
          animate={{ fill: editingDesign ? "rgba(235, 135, 0, 0.08)" : "transparent" }}
          transition={{ duration: 0.3 }}
        />
        <motion.circle
          key={`d-${designColor}`}
          cx="43" cy="100" r="7" fill={designColor}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        />
        <text x="58" y="104" fill="var(--foreground)" fontSize="11" fontFamily="var(--font-family-mono)">primary</text>

        {/* Design token row 2 — static */}
        <circle cx="43" cy="132" r="7" fill="var(--surface-light-2)" stroke="var(--border)" strokeWidth="1" />
        <text x="58" y="136" fill="var(--muted-foreground)" fontSize="11" fontFamily="var(--font-family-mono)">surface</text>

        {/* Design token row 3 — static */}
        <circle cx="43" cy="164" r="7" fill="var(--surface-light-12)" stroke="var(--border)" strokeWidth="1" />
        <text x="58" y="168" fill="var(--muted-foreground)" fontSize="11" fontFamily="var(--font-family-mono)">text</text>

        {/* RIGHT: Code panel */}
        <defs>
          <clipPath id="code-panel-clip">
            <rect x="230" y="30" width="150" height="180" rx="12" />
          </clipPath>
        </defs>
        <rect x="230" y="30" width="150" height="180" rx="12" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />

        <g clipPath="url(#code-panel-clip)">
          <text x="246" y="54" fill="var(--foreground)" fontSize="12" fontWeight="600">semantics.css</text>
          <path d="M 230 68 L 380 68" stroke="var(--border)" strokeWidth="1" />

          {/* Code content — shifted down 8px for balanced spacing */}
          <text x="246" y="92" fill="var(--muted-foreground)" fontSize="10" fontFamily="var(--font-family-mono)">{":"}</text>
          <text x="252" y="92" fill="var(--muted-foreground)" fontSize="10" fontFamily="var(--font-family-mono)">root {"{"}</text>

          <motion.rect
            x="238" y="99" width="134" height="20" rx="4"
            animate={{ fill: editingCode ? "rgba(235, 135, 0, 0.08)" : "transparent" }}
          />
          <text x="250" y="112" fill="var(--primary)" fontSize="10" fontFamily="var(--font-family-mono)">--primary: </text>

          <motion.text
            key={`c-${codeColor}`}
            x="318" y="112" fontSize="10" fontFamily="var(--font-family-mono)"
            initial={{ fill: "var(--foreground)" }}
            animate={{ fill: codeColor }}
            transition={{ duration: 0.4 }}
          >
            {codeColor}
          </motion.text>

          {/* Blinking cursor */}
          <motion.rect
            x="368" y="103" width="2" height="11" fill="var(--primary)"
            initial={{ opacity: 0 }}
            animate={{ opacity: editingCode ? [1, 0] : 0 }}
            transition={{ repeat: editingCode ? Number.POSITIVE_INFINITY : 0, duration: 0.4 }}
          />

          <text x="250" y="136" fill="var(--primary)" fontSize="10" fontFamily="var(--font-family-mono)">--surface: </text>
          <text x="318" y="136" fill="var(--muted-foreground)" fontSize="10" fontFamily="var(--font-family-mono)">#F9F9F9</text>

          <text x="250" y="160" fill="var(--primary)" fontSize="10" fontFamily="var(--font-family-mono)">--text: </text>
          <text x="318" y="160" fill="var(--muted-foreground)" fontSize="10" fontFamily="var(--font-family-mono)">#202020</text>

          <text x="246" y="176" fill="var(--muted-foreground)" fontSize="10" fontFamily="var(--font-family-mono)">{"}"}</text>
        </g>

        {/* CENTER: Sync bridges */}
        {/* Export path L→R */}
        <path d="M 170 100 L 230 100" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
        <motion.path
          d="M 170 100 L 230 100" stroke={designColor} strokeWidth="2.5" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: flow === "l-r" ? 1 : 0,
            opacity: flow === "l-r" ? [0, 1, 1, 0] : 0,
          }}
          transition={{
            pathLength: { duration: flow === "l-r" ? 0.7 : 0, ease: "easeInOut" },
            opacity: { duration: flow === "l-r" ? 0.7 : 0, times: [0, 0.1, 0.8, 1] },
          }}
        />
        <motion.circle
          cy="100" r="4.5" fill={designColor}
          initial={{ cx: 170, opacity: 0 }}
          animate={{
            cx: flow === "l-r" ? 230 : 170,
            opacity: flow === "l-r" ? [0, 1, 1, 0] : 0,
          }}
          transition={{
            cx: { duration: flow === "l-r" ? 0.7 : 0, ease: "easeInOut" },
            opacity: { duration: flow === "l-r" ? 0.7 : 0, times: [0, 0.1, 0.8, 1] },
          }}
        />

        {/* Import path R→L */}
        <path d="M 230 156 L 170 156" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
        <motion.path
          d="M 230 156 L 170 156" stroke={codeColor} strokeWidth="2.5" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: flow === "r-l" ? 1 : 0,
            opacity: flow === "r-l" ? [0, 1, 1, 0] : 0,
          }}
          transition={{
            pathLength: { duration: flow === "r-l" ? 0.7 : 0, ease: "easeInOut" },
            opacity: { duration: flow === "r-l" ? 0.7 : 0, times: [0, 0.1, 0.8, 1] },
          }}
        />
        <motion.circle
          cy="156" r="4.5" fill={codeColor}
          initial={{ cx: 230, opacity: 0 }}
          animate={{
            cx: flow === "r-l" ? 170 : 230,
            opacity: flow === "r-l" ? [0, 1, 1, 0] : 0,
          }}
          transition={{
            cx: { duration: flow === "r-l" ? 0.7 : 0, ease: "easeInOut" },
            opacity: { duration: flow === "r-l" ? 0.7 : 0, times: [0, 0.1, 0.8, 1] },
          }}
        />
      </svg>
    </div>
  );
}
