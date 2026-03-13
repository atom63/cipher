import { useEffect, useState } from "react";

export function useDebugMode() {
  const [isDebugMode, setIsDebugMode] = useState(() => {
    return document.body.classList.contains("debug-mode");
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "D") {
        event.preventDefault();
        setIsDebugMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
