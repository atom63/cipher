import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  disableTransitions: () => void;
  isChanging: boolean;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
  setTheme: (theme: Theme) => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    return (localStorage.getItem("theme") as Theme) || "dark";
  });

  const [isDark, setIsDark] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    const computedIsDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    setIsDark(computedIsDark);

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const computedIsDark = mediaQuery.matches;
      setIsDark(computedIsDark);

      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(computedIsDark ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const disableTransitions = () => {
    setIsChanging(true);
    // Re-enable transitions after a short delay
    setTimeout(() => setIsChanging(false), 100);
  };

  const setAndStoreTheme = (newTheme: Theme) => {
    if (newTheme === theme) {
      return;
    }

    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    // Disable CSS transitions during theme change
    setIsChanging(true);

    // Re-enable transitions after a short delay
    setTimeout(() => {
      setIsChanging(false);
    }, 100);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: setAndStoreTheme,
        isDark,
        isLight: !isDark,
        isSystem: theme === "system",
        isChanging,
        disableTransitions,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
