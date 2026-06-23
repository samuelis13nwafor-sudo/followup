import { createContext, useContext, useState, useCallback } from "react";

const STORAGE_KEY = "followup_hasSeenDemo";

interface OnboardingContextValue {
  hasSeenDemo: boolean;
  markDemoSeen: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [hasSeenDemo, setHasSeenDemo] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === "true"
  );

  const markDemoSeen = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setHasSeenDemo(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasSeenDemo(false);
  }, []);

  return (
    <OnboardingContext.Provider value={{ hasSeenDemo, markDemoSeen, resetOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
