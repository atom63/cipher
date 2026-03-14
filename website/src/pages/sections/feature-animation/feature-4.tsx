import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useTokenColors } from "./use-token-color";
import { useVisible } from "./use-visible";

type Phase = "idle" | "extract" | "compile" | "build" | "done";

export function ModernCssAnimation() {
  const { ref, visible } = useVisible();
  const c = useTokenColors({
    primary: "var(--color-brand-primary-500)",
    info: "var(--color-info-500)",
  });

  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    let mounted = true;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      while (mounted) {
        setPhase("idle");
        await sleep(1200);
        if (!mounted) break;
        setPhase("extract");
        await sleep(800);
        if (!mounted) break;
        setPhase("compile");
        await sleep(1200);
        if (!mounted) break;
        setPhase("build");
        await sleep(800);
        if (!mounted) break;
        setPhase("done");
        await sleep(2500);
        if (!mounted) break;
      }
    };

    if (visible) run();
    return () => { mounted = false; };
  }, [visible]);

  const draw = { duration: 0.8, ease: "easeInOut" as const };
  const fade = { duration: 0.4 };
  const isActive = phase === "compile" || phase === "build";
  const isDone = phase === "done";

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
        {/* LEFT: Design Tokens */}
        <rect x="20" y="30" width="110" height="180" rx="12" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
        <text x="36" y="54" fill="var(--foreground)" fontSize="12" fontWeight="600">Tokens</text>
        <path d="M 20 66 L 130 66" stroke="var(--border)" strokeWidth="1" />

        {/* Token rows */}
        <rect x="28" y="83" width="94" height="24" rx="4" fill="var(--secondary)" stroke="var(--border)" strokeWidth="1" />
        <circle cx="42" cy="95" r="5" fill="var(--primary)" />
        <text x="54" y="98" fill="var(--muted-foreground)" fontSize="9" fontFamily="var(--font-family-mono)">color.brand</text>

        <rect x="28" y="111" width="94" height="24" rx="4" fill="var(--secondary)" stroke="var(--border)" strokeWidth="1" />
        <rect x="37" y="118" width="10" height="10" rx="3" fill="none" stroke="var(--foreground)" strokeWidth="1.5" />
        <text x="54" y="126" fill="var(--muted-foreground)" fontSize="9" fontFamily="var(--font-family-mono)">radius.md</text>

        <rect x="28" y="139" width="94" height="24" rx="4" fill="var(--secondary)" stroke="var(--border)" strokeWidth="1" />
        <text x="42" y="155" textAnchor="middle" fill="var(--foreground)" fontSize="11" fontWeight="bold">Aa</text>
        <text x="54" y="154" fill="var(--muted-foreground)" fontSize="9" fontFamily="var(--font-family-mono)">font.sans</text>

        {/* CENTER: Tailwind v4 */}
        <motion.rect
          x="165" y="80" width="70" height="85" rx="12"
          fill="var(--secondary)"
          stroke={c.info}
          initial={{ strokeWidth: 1, opacity: 0.6 }}
          animate={{
            strokeWidth: isActive ? 2 : 1,
            opacity: isActive ? 1 : 0.6,
          }}
          transition={fade}
        />

        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{
            opacity: isActive || isDone ? 1 : 0,
            y: isActive || isDone ? 0 : 5,
          }}
          transition={{ duration: 0.4, delay: phase === "compile" ? 0.2 : 0 }}
        >
          <text x="172" y="100" fill={c.info} fontSize="9" fontFamily="var(--font-family-mono)">@theme {"{"}</text>
          <text x="178" y="118" fill="var(--primary)" fontSize="9" fontFamily="var(--font-family-mono)">--color</text>
          <text x="178" y="132" fill="var(--primary)" fontSize="9" fontFamily="var(--font-family-mono)">--radius</text>
          <text x="172" y="150" fill={c.info} fontSize="9" fontFamily="var(--font-family-mono)">{"}"}</text>
        </motion.g>

        {/* RIGHT: shadcn/ui */}
        <rect x="270" y="30" width="110" height="180" rx="12" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
        <text x="286" y="54" fill="var(--foreground)" fontSize="12" fontWeight="600">shadcn/ui</text>
        <path d="M 270 66 L 380 66" stroke="var(--border)" strokeWidth="1" />

        {/* Card skeleton */}
        <motion.rect
          x="285" y="85" width="80" height="105"
          fill="var(--secondary)" stroke="var(--border)" strokeWidth="1"
          initial={{ rx: 0 }}
          animate={{ rx: isDone ? 8 : 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <rect x="295" y="100" width="40" height="6" rx="2" fill="var(--muted)" />
        <rect x="295" y="112" width="60" height="4" rx="2" fill="var(--border)" />
        <rect x="295" y="120" width="50" height="4" rx="2" fill="var(--border)" />

        {/* Styled button */}
        <motion.rect
          x="295" y="145" width="60" height="24"
          initial={{ rx: 0, fill: "var(--muted)" }}
          animate={{
            rx: isDone ? 6 : 0,
            fill: isDone ? c.primary : "var(--muted)",
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <text x="325" y="160" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Button</text>

        {/* Button glow — scales from button center */}
        <motion.rect
          x="295" y="145" width="60" height="24" rx="6"
          fill="none" stroke={c.primary} strokeWidth="2"
          style={{ transformOrigin: "325px 157px", transformBox: "fill-box" as never }}
          initial={{ opacity: 0, scaleX: 1, scaleY: 1 }}
          animate={{
            opacity: isDone ? [0, 0.5, 0] : 0,
            scaleX: isDone ? 1.2 : 1,
            scaleY: isDone ? 1.3 : 1,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* DATA FLOW PATHS */}
        {/* L1: Color token → Tailwind */}
        <path d="M 130 95 C 147 95, 147 122, 165 122" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
        <motion.path
          d="M 130 95 C 147 95, 147 122, 165 122" stroke={c.primary} strokeWidth="2" fill="none" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: phase === "extract" ? 1 : 0,
            opacity: phase === "extract" ? [0, 1, 1, 0] : 0,
          }}
          transition={{
            pathLength: { duration: phase === "extract" ? draw.duration : 0, ease: draw.ease },
            opacity: { duration: phase === "extract" ? draw.duration : 0, times: [0, 0.1, 0.8, 1] },
          }}
        />

        {/* L2: Radius token → Tailwind */}
        <path d="M 130 123 L 165 122" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
        <motion.path
          d="M 130 123 L 165 122" stroke="var(--foreground)" strokeWidth="2" fill="none" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: phase === "extract" ? 1 : 0,
            opacity: phase === "extract" ? [0, 1, 1, 0] : 0,
          }}
          transition={{
            pathLength: { duration: phase === "extract" ? draw.duration : 0, ease: draw.ease },
            opacity: { duration: phase === "extract" ? draw.duration : 0, times: [0, 0.1, 0.8, 1] },
          }}
        />

        {/* L3: Font token → Tailwind */}
        <path d="M 130 151 C 147 151, 147 122, 165 122" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
        <motion.path
          d="M 130 151 C 147 151, 147 122, 165 122" stroke="var(--foreground)" strokeWidth="2" fill="none" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: phase === "extract" ? 1 : 0,
            opacity: phase === "extract" ? [0, 1, 1, 0] : 0,
          }}
          transition={{
            pathLength: { duration: phase === "extract" ? draw.duration : 0, ease: draw.ease },
            opacity: { duration: phase === "extract" ? draw.duration : 0, times: [0, 0.1, 0.8, 1] },
          }}
        />

        {/* R1: Tailwind → shadcn */}
        <path d="M 235 122 L 270 122" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
        <motion.path
          d="M 235 122 L 270 122" stroke={c.info} strokeWidth="2.5" fill="none" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: phase === "build" ? 1 : 0,
            opacity: phase === "build" ? [0, 1, 1, 0] : 0,
          }}
          transition={{
            pathLength: { duration: phase === "build" ? draw.duration : 0, ease: draw.ease },
            opacity: { duration: phase === "build" ? draw.duration : 0, times: [0, 0.1, 0.8, 1] },
          }}
        />
        <motion.circle
          cy="122" r="4" fill="var(--foreground)"
          initial={{ cx: 235, opacity: 0 }}
          animate={{
            cx: phase === "build" ? 270 : 235,
            opacity: phase === "build" ? [0, 1, 1, 0] : 0,
          }}
          transition={{
            cx: { duration: phase === "build" ? draw.duration : 0, ease: draw.ease },
            opacity: { duration: phase === "build" ? draw.duration : 0, times: [0, 0.1, 0.8, 1] },
          }}
        />
      </svg>
    </div>
  );
}
