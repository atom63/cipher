"use client";

import { CircleCheck, Copy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  className?: string;
  text: string;
}

const iconTransition = {
  type: "spring" as const,
  duration: 0.15,
  bounce: 0,
};

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setCopied(false), 1500);
  }, [text]);

  return (
    <motion.button
      aria-label={copied ? "Copied" : "Copy code"}
      className={cn(
        "absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-md border border-transparent text-muted-foreground/60 opacity-0 transition-[opacity,color,background-color] hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/code:opacity-100",
        copied && "text-primary hover:text-primary",
        className
      )}
      onClick={handleCopy}
      transition={iconTransition}
      type="button"
      whileTap={{ scale: 0.97 }}
    >
      <AnimatePresence initial={false} mode="wait">
        {copied ? (
          <motion.span
            animate={{ opacity: 1, filter: "blur(0px)" }}
            className="flex items-center justify-center"
            exit={{ opacity: 0, filter: "blur(2px)" }}
            initial={{ opacity: 0, filter: "blur(2px)" }}
            key="check"
            transition={iconTransition}
          >
            <CircleCheck className="size-4 fill-primary stroke-background" />
          </motion.span>
        ) : (
          <motion.span
            animate={{ opacity: 1, filter: "blur(0px)" }}
            className="flex items-center justify-center"
            exit={{ opacity: 0, filter: "blur(2px)" }}
            initial={{ opacity: 0, filter: "blur(2px)" }}
            key="copy"
            transition={iconTransition}
          >
            <Copy className="size-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
