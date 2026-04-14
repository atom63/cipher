import { createContext, useContext, useState } from "react";

interface GridContextType {
  showGrid: boolean;
  toggleGrid: () => void;
}

const GridContext = createContext<GridContextType | undefined>(undefined);

export function GridProvider({ children }: { children: React.ReactNode }) {
  const [showGrid, setShowGrid] = useState(true);

  return (
    <GridContext.Provider
      value={{ showGrid, toggleGrid: () => setShowGrid((p) => !p) }}
    >
      {children}
    </GridContext.Provider>
  );
}

export function useGrid() {
  const ctx = useContext(GridContext);
  if (!ctx) {
    throw new Error("useGrid must be used within GridProvider");
  }
  return ctx;
}
