import { createContext, useContext, useState } from "react";

type ViewDensity = "comfortable" | "compact";

interface ViewContextValue {
  density: ViewDensity;
  setDensity: (d: ViewDensity) => void;
}

const ViewContext = createContext<ViewContextValue | null>(null);

const STORAGE_KEY = "followup_view_density";

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = useState<ViewDensity>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "compact" ? "compact" : "comfortable";
  });

  function setDensity(d: ViewDensity) {
    localStorage.setItem(STORAGE_KEY, d);
    setDensityState(d);
  }

  return (
    <ViewContext.Provider value={{ density, setDensity }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("useView must be used within ViewProvider");
  return ctx;
}
