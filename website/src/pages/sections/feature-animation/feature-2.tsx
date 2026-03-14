import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useTokenColors } from "./use-token-color";
import { useVisible } from "./use-visible";

type Phase = "idle" | "select-two" | "rename" | "select-one" | "update-color" | "deselect";

export function ManageAnimation() {
  const { ref, visible } = useVisible();
  const c = useTokenColors({
    primary500: "var(--color-brand-primary-500)",
    primary600: "var(--color-brand-primary-600)",
    primary200: "var(--color-brand-primary-200)",
    secondary500: "var(--color-brand-secondary-500)",
  });

  const tokens = useMemo(
    () => [
      { id: "t1", y: 90, baseName: "color.primary.muted", updatedName: "color.brand.muted", baseColorHex: c.primary600, updatedColorHex: c.secondary500 },
      { id: "t2", y: 135, baseName: "color.primary.base", updatedName: "color.brand.base", baseColorHex: c.primary500, updatedColorHex: c.primary500 },
      { id: "t3", y: 180, baseName: "color.primary.light", updatedName: "color.brand.light", baseColorHex: c.primary200, updatedColorHex: c.primary200 },
    ],
    [c],
  );
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    let mounted = true;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      while (mounted) {
        await sleep(1500);
        if (!mounted) break;
        setPhase("select-two");
        await sleep(1000);
        if (!mounted) break;
        setPhase("rename");
        await sleep(1500);
        if (!mounted) break;
        setPhase("select-one");
        await sleep(800);
        if (!mounted) break;
        setPhase("update-color");
        await sleep(1500);
        if (!mounted) break;
        setPhase("deselect");
        await sleep(1000);
        if (!mounted) break;
        setPhase("idle");
      }
    };

    if (visible) run();
    return () => { mounted = false; };
  }, [visible]);

  const isT1Selected = ["select-two", "rename", "select-one", "update-color"].includes(phase);
  const isT2Selected = ["select-two", "rename"].includes(phase);
  const isRenamed = ["rename", "select-one", "update-color", "deselect"].includes(phase);
  const isColorUpdated = ["update-color", "deselect"].includes(phase);
  const actionCount = isT2Selected ? 2 : isT1Selected ? 1 : 0;
  const showActionBar = actionCount > 0;

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
        {/* Window */}
        <rect x="20" y="20" width="360" height="200" rx="16" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />

        {/* Header */}
        <text x="40" y="52" fill="var(--foreground)" fontSize="13" fontWeight="600">Variables</text>

        {/* Token rows */}
        {tokens.map((token, index) => {
          const rowSelected = (index === 0 && isT1Selected) || (index === 1 && isT2Selected);
          const nameText = isRenamed && index < 2 ? token.updatedName : token.baseName;
          const colorUpdated = isColorUpdated && index === 0;
          const colorHex = colorUpdated ? token.updatedColorHex : token.baseColorHex;
          const primaryHex = c.primary500;

          return (
            <motion.g key={token.id} initial={{ y: token.y }} animate={{ y: token.y }} transition={{ duration: 0.4 }}>
              {/* Row highlight */}
              <motion.rect
                x="30" y="-18" width="340" height="36" rx="8"
                initial={{ fill: "transparent" }}
                animate={{ fill: rowSelected ? "rgba(235, 135, 0, 0.08)" : "transparent" }}
                transition={{ duration: 0.3 }}
              />

              {/* Checkbox */}
              <rect
                x="40" y="-7" width="14" height="14" rx="4"
                fill="var(--secondary)"
                stroke={rowSelected ? primaryHex : "var(--border)"}
                strokeWidth="1.5"
              />
              <motion.path
                d="M 43 -1 L 46 2 L 51 -4"
                fill="none"
                stroke={primaryHex}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: rowSelected ? 1 : 0, opacity: rowSelected ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />

              {/* Color swatch */}
              <motion.rect
                x="70" y="-9" width="18" height="18" rx="5"
                animate={{ fill: colorHex }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />

              {/* Token name */}
              <motion.text
                x="100" y="4" fontSize="12" fontFamily="var(--font-family-mono)"
                animate={{
                  fill: isRenamed && index < 2 && phase === "rename"
                    ? [primaryHex, "var(--foreground)"]
                    : "var(--foreground)",
                }}
                transition={{ duration: 0.8 }}
              >
                {nameText}
              </motion.text>

              {/* Token value */}
              <motion.text
                x="360" y="4" textAnchor="end" fontSize="11" fontFamily="var(--font-family-mono)"
                animate={{ fill: colorUpdated ? primaryHex : "var(--muted-foreground)" }}
                transition={{ duration: 0.6 }}
              >
                {colorHex}
              </motion.text>
            </motion.g>
          );
        })}

        {/* Floating action bar */}
        <motion.g
          initial={{ y: 250, opacity: 0 }}
          animate={{
            y: showActionBar ? 170 : 260,
            opacity: showActionBar ? 1 : 0,
          }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
        >
          <rect x="120" y="0" width="160" height="36" rx="18" fill="var(--secondary)" stroke="var(--border)" strokeWidth="1.5" />

          {/* Count badge */}
          <circle cx="140" cy="18" r="10" fill="var(--primary)" opacity="0.1" />
          <circle cx="140" cy="18" r="10" fill="none" stroke="var(--primary)" strokeWidth="1" opacity="0.2" />
          <motion.text
            x="140" y="21.5" textAnchor="middle" fill="var(--primary)" fontSize="10" fontWeight="bold"
            key={actionCount}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {actionCount}
          </motion.text>
          <text x="158" y="22" fill="var(--foreground)" fontSize="11" fontWeight="500">Selected</text>

          {/* Edit icon — aligned to bar end */}
          <g transform="translate(260, 18)">
            <circle cx="0" cy="0" r="12" fill="var(--card)" />
            {/* Pencil icon */}
            <path
              d="M-4 4 L-5 6 L-3 5 L4 -2 L2 -4 Z"
              fill="none" stroke="var(--muted-foreground)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
            />
            <path
              d="M2 -4 L4 -2"
              fill="none" stroke="var(--muted-foreground)" strokeWidth="1.3" strokeLinecap="round"
            />
          </g>

          {/* Action pulse */}
          <motion.circle
            cx="260" cy="18" r="12" fill="none" stroke="var(--primary)" strokeWidth="2"
            animate={{
              scale: phase === "rename" || phase === "update-color" ? 1.5 : 0.8,
              opacity: phase === "rename" || phase === "update-color" ? [0, 1, 0] : 0,
            }}
            transition={{ duration: 0.6 }}
          />
        </motion.g>
      </svg>
    </div>
  );
}
