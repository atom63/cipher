import type React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/contexts/theme-context";

const Toaster = ({ ...props }: ToasterProps) => {
  const { isDark } = useTheme();

  return (
    <Sonner
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--bg-surface)",
          "--normal-text": "var(--text-main)",
          "--normal-border": "var(--border-subtle)",
          "--border-radius": "8px",
        } as React.CSSProperties
      }
      theme={isDark ? "dark" : "light"}
      {...props}
    />
  );
};

export { Toaster };
