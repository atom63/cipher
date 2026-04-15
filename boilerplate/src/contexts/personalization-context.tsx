import { createContext, useContext, useEffect, useState } from "react";

// Available palette options — matches website/src/styles/tokens/primitives.css (b1–b6, n1–n6)
export const BRAND_OPTIONS = ["b1", "b2", "b3", "b4", "b5", "b6"] as const;
export const SURFACE_OPTIONS = ["n1", "n2", "n3", "n4", "n5", "n6"] as const;

export type BrandId = (typeof BRAND_OPTIONS)[number];
export type SurfaceId = (typeof SURFACE_OPTIONS)[number];

interface PersonalizationState {
  brand: BrandId | null;
  surfaceDark: SurfaceId | null;
  surfaceLight: SurfaceId | null;
}

interface PersonalizationContextType {
  brand: BrandId;
  dirty: boolean;
  reset: () => void;
  setBrand: (brand: BrandId) => void;
  setSurfaceDark: (surface: SurfaceId) => void;
  setSurfaceLight: (surface: SurfaceId) => void;
  surfaceDark: SurfaceId;
  surfaceLight: SurfaceId;
}

const STORAGE_KEY = "personalization";

// What the CSS files define — used as display values when no override is set
const CSS_DEFAULTS = {
  brand: "b1" as BrandId,
  surfaceLight: "n1" as SurfaceId,
  surfaceDark: "n1" as SurfaceId,
};

function loadState(): PersonalizationState {
  if (typeof window === "undefined")
    return { brand: null, surfaceLight: null, surfaceDark: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { brand: null, surfaceLight: null, surfaceDark: null };
    const parsed = JSON.parse(raw);
    return {
      brand: BRAND_OPTIONS.includes(parsed.brand) ? parsed.brand : null,
      surfaceLight: SURFACE_OPTIONS.includes(parsed.surfaceLight)
        ? parsed.surfaceLight
        : null,
      surfaceDark: SURFACE_OPTIONS.includes(parsed.surfaceDark)
        ? parsed.surfaceDark
        : null,
    };
  } catch {
    return { brand: null, surfaceLight: null, surfaceDark: null };
  }
}

function applyToDOM(state: PersonalizationState) {
  const root = document.documentElement;

  // Brand: only override if user has selected one
  if (state.brand) {
    root.style.setProperty("--primary", `var(--color-${state.brand}-500)`);
  } else {
    root.style.removeProperty("--primary");
  }

  // Surfaces: only override if user has selected
  for (let i = 1; i <= 12; i++) {
    if (state.surfaceLight) {
      root.style.setProperty(
        `--surface-light-${i}`,
        `var(--color-${state.surfaceLight}-light-${i})`,
      );
    } else {
      root.style.removeProperty(`--surface-light-${i}`);
    }
    if (state.surfaceDark) {
      root.style.setProperty(
        `--surface-dark-${i}`,
        `var(--color-${state.surfaceDark}-dark-${i})`,
      );
    } else {
      root.style.removeProperty(`--surface-dark-${i}`);
    }
  }
}

const PersonalizationContext = createContext<
  PersonalizationContextType | undefined
>(undefined);

export function PersonalizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<PersonalizationState>(loadState);

  useEffect(() => {
    applyToDOM(state);
    if (state.brand || state.surfaceLight || state.surfaceDark) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state]);

  const dirty = !!(state.brand || state.surfaceLight || state.surfaceDark);

  const setBrand = (brand: BrandId) => setState((s) => ({ ...s, brand }));
  const setSurfaceLight = (surfaceLight: SurfaceId) =>
    setState((s) => ({ ...s, surfaceLight }));
  const setSurfaceDark = (surfaceDark: SurfaceId) =>
    setState((s) => ({ ...s, surfaceDark }));
  const reset = () =>
    setState({ brand: null, surfaceLight: null, surfaceDark: null });

  return (
    <PersonalizationContext.Provider
      value={{
        brand: state.brand ?? CSS_DEFAULTS.brand,
        surfaceLight: state.surfaceLight ?? CSS_DEFAULTS.surfaceLight,
        surfaceDark: state.surfaceDark ?? CSS_DEFAULTS.surfaceDark,
        dirty,
        reset,
        setBrand,
        setSurfaceLight,
        setSurfaceDark,
      }}
    >
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  const context = useContext(PersonalizationContext);
  if (!context)
    throw new Error(
      "usePersonalization must be used within PersonalizationProvider",
    );
  return context;
}
