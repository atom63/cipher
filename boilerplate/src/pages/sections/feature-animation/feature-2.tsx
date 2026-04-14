import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useTokenColors } from "./use-token-color";
import { useVisible } from "./use-visible";

type Phase =
  | "idle"
  | "select-two"
  | "rename"
  | "select-one"
  | "update-color"
  | "deselect";

export function ManageAnimation() {
  const { ref, visible } = useVisible();
  const c = useTokenColors({
    primary500: "var(--color-b1-500)",
    primary600: "var(--color-b1-600)",
    primary200: "var(--color-b1-200)",
    secondary500: "var(--color-b2-500)",
  });

  const tokens = useMemo(
    () => [
      {
        id: "t1",
        y: 90,
        baseName: "color.primary.muted",
        updatedName: "color.brand.muted",
        baseColorHex: c.primary600,
        updatedColorHex: c.secondary500,
      },
      {
        id: "t2",
        y: 135,
        baseName: "color.primary.base",
        updatedName: "color.brand.base",
        baseColorHex: c.primary500,
        updatedColorHex: c.primary500,
      },
      {
        id: "t3",
        y: 180,
        baseName: "color.primary.light",
        updatedName: "color.brand.light",
        baseColorHex: c.primary200,
        updatedColorHex: c.primary200,
      },
    ],
    [c]
  );
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    let mounted = true;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      while (mounted) {
        await sleep(1400);
        if (!mounted) {
          break;
        }
        setPhase("select-two");
        await sleep(1000);
        if (!mounted) {
          break;
        }
        setPhase("rename");
        await sleep(1400);
        if (!mounted) {
          break;
        }
        setPhase("select-one");
        await sleep(800);
        if (!mounted) {
          break;
        }
        setPhase("update-color");
        await sleep(1400);
        if (!mounted) {
          break;
        }
        setPhase("deselect");
        await sleep(1000);
        if (!mounted) {
          break;
        }
        setPhase("idle");
      }
    };

    if (visible) {
      run();
    }
    return () => {
      mounted = false;
    };
  }, [visible]);

  const isT1Selected = [
    "select-two",
    "rename",
    "select-one",
    "update-color",
  ].includes(phase);
  const isT2Selected = ["select-two", "rename"].includes(phase);
  const isRenamed = [
    "rename",
    "select-one",
    "update-color",
    "deselect",
  ].includes(phase);
  const isColorUpdated = ["update-color", "deselect"].includes(phase);
  const actionCount = isT2Selected ? 2 : isT1Selected ? 1 : 0;
  const showActionBar = actionCount > 0;

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

      <svg className="relative z-10 h-auto w-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 400 240">
        {/* Window */}
        <rect
          fill="var(--card)"
          height="200"
          rx="16"
          stroke="var(--border)"
          strokeWidth="1.5"
          width="360"
          x="20"
          y="20"
        />

        {/* Header */}
        <text
          fill="var(--foreground)"
          fontSize="13"
          fontWeight="600"
          x="40"
          y="52"
        >
          Variables
        </text>

        {/* Token rows */}
        {tokens.map((token, index) => {
          const rowSelected =
            (index === 0 && isT1Selected) || (index === 1 && isT2Selected);
          const nameText =
            isRenamed && index < 2 ? token.updatedName : token.baseName;
          const colorUpdated = isColorUpdated && index === 0;
          const colorHex = colorUpdated
            ? token.updatedColorHex
            : token.baseColorHex;
          const primaryHex = c.primary500;

          return (
            <motion.g
              animate={{ y: token.y }}
              initial={{ y: token.y }}
              key={token.id}
              transition={{ duration: 0.4 }}
            >
              {/* Row highlight */}
              <motion.rect
                animate={{
                  fill: rowSelected ? "rgba(235, 135, 0, 0.08)" : "transparent",
                }}
                height="36"
                initial={{ fill: "transparent" }}
                rx="8"
                transition={{ duration: 0.3 }}
                width="340"
                x="30"
                y="-18"
              />

              {/* Checkbox */}
              <rect
                fill="var(--secondary)"
                height="14"
                rx="4"
                stroke={rowSelected ? primaryHex : "var(--border)"}
                strokeWidth="1.5"
                width="14"
                x="40"
                y="-7"
              />
              <motion.path
                animate={{
                  pathLength: rowSelected ? 1 : 0,
                  opacity: rowSelected ? 1 : 0,
                }}
                d="M 43 -1 L 46 2 L 51 -4"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                stroke={primaryHex}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                transition={{ duration: 0.3 }}
              />

              {/* Color swatch */}
              <motion.rect
                animate={{ fill: colorHex }}
                height="18"
                rx="5"
                transition={{ duration: 0.6, ease: "easeInOut" }}
                width="18"
                x="70"
                y="-9"
              />

              {/* Token name */}
              <motion.text
                animate={{
                  fill:
                    isRenamed && index < 2 && phase === "rename"
                      ? [primaryHex, "var(--foreground)"]
                      : "var(--foreground)",
                }}
                fontFamily="var(--font-family-mono)"
                fontSize="12"
                transition={{ duration: 0.8 }}
                x="100"
                y="4"
              >
                {nameText}
              </motion.text>

              {/* Token value */}
              <motion.text
                animate={{
                  fill: colorUpdated ? primaryHex : "var(--muted-foreground)",
                }}
                fontFamily="var(--font-family-mono)"
                fontSize="11"
                textAnchor="end"
                transition={{ duration: 0.6 }}
                x="360"
                y="4"
              >
                {colorHex}
              </motion.text>
            </motion.g>
          );
        })}

        {/* Floating action bar */}
        <motion.g
          animate={{
            y: showActionBar ? 170 : 260,
            opacity: showActionBar ? 1 : 0,
          }}
          initial={{ y: 250, opacity: 0 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
        >
          <rect
            fill="var(--secondary)"
            height="36"
            rx="18"
            stroke="var(--border)"
            strokeWidth="1.5"
            width="160"
            x="120"
            y="0"
          />

          {/* Count badge */}
          <circle cx="140" cy="18" fill="var(--primary)" opacity="0.1" r="10" />
          <circle
            cx="140"
            cy="18"
            fill="none"
            opacity="0.2"
            r="10"
            stroke="var(--primary)"
            strokeWidth="1"
          />
          <motion.text
            animate={{ scale: 1, opacity: 1 }}
            fill="var(--primary)"
            fontSize="10"
            fontWeight="bold"
            initial={{ scale: 0.5, opacity: 0 }}
            key={actionCount}
            textAnchor="middle"
            x="140"
            y="21.5"
          >
            {actionCount}
          </motion.text>
          <text
            fill="var(--foreground)"
            fontSize="11"
            fontWeight="500"
            x="158"
            y="22"
          >
            Selected
          </text>

          {/* Edit icon — aligned to bar end */}
          <g transform="translate(260, 18)">
            <circle cx="0" cy="0" fill="var(--card)" r="12" />
            {/* Pencil icon */}
            <path
              d="M-4 4 L-5 6 L-3 5 L4 -2 L2 -4 Z"
              fill="none"
              stroke="var(--muted-foreground)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.3"
            />
            <path
              d="M2 -4 L4 -2"
              fill="none"
              stroke="var(--muted-foreground)"
              strokeLinecap="round"
              strokeWidth="1.3"
            />
          </g>

          {/* Action pulse */}
          <motion.circle
            animate={{
              scale: phase === "rename" || phase === "update-color" ? 1.5 : 0.8,
              opacity:
                phase === "rename" || phase === "update-color" ? [0, 1, 0] : 0,
            }}
            cx="260"
            cy="18"
            fill="none"
            r="12"
            stroke="var(--primary)"
            strokeWidth="2"
            transition={{ duration: 0.6 }}
          />
        </motion.g>
      </svg>
    </div>
  );
}
