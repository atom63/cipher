import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/theme-context";

export function useDebugMode() {
  const { isDark, setTheme } = useTheme();

  const [isDebugMode, setIsDebugMode] = useState(() => {
    return document.body.classList.contains("debug-mode");
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "D") {
        event.preventDefault();
        setIsDebugMode((prev) => !prev);
      }
      if (event.ctrlKey && event.shiftKey && event.key === "L") {
        event.preventDefault();
        setTheme(isDark ? "light" : "dark");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDark, setTheme]);

  useEffect(() => {
    if (isDebugMode) {
      document.body.classList.add("debug-mode");
    } else {
      document.body.classList.remove("debug-mode");
    }
  }, [isDebugMode]);

  return {
    isDebugMode,
    toggleDebugMode: () => setIsDebugMode((prev) => !prev),
  };
}
