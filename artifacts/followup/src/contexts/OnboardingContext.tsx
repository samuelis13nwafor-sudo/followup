import { createContext, useContext, useState, useCallback } from "react";
import { Lead } from "./LeadsContext";
import { getSeedLeads } from "../lib/leadUtils";

const SEEN_KEY = "followup_hasSeenDemo";
const BACKUP_KEY = "followup_real_backup";
const REAL_KEY = "followup_leads";

interface OnboardingContextValue {
  hasSeenDemo: boolean;
  isDemoMode: boolean;
  markDemoSeen: () => void;
  startDemo: (replaceAllLeads: (leads: Lead[]) => void, currentLeads: Lead[]) => void;
  endDemo: (replaceAllLeads: (leads: Lead[]) => void) => void;
  resetOnboarding: (replaceAllLeads?: (leads: Lead[]) => void) => void;
  clearRealLeads: (replaceAllLeads: (leads: Lead[]) => void) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [hasSeenDemo, setHasSeenDemo] = useState<boolean>(
    () => localStorage.getItem(SEEN_KEY) === "true"
  );

  // Demo mode is active whenever the backup key exists
  const [isDemoMode, setIsDemoMode] = useState<boolean>(
    () => localStorage.getItem(BACKUP_KEY) !== null
  );

  const markDemoSeen = useCallback(() => {
    localStorage.setItem(SEEN_KEY, "true");
    setHasSeenDemo(true);
  }, []);

  const startDemo = useCallback(
    (replaceAllLeads: (leads: Lead[]) => void, currentLeads: Lead[]) => {
      // Back up real leads so we can restore them after demo
      localStorage.setItem(BACKUP_KEY, JSON.stringify(currentLeads));
      // Load temporary demo data
      replaceAllLeads(getSeedLeads());
      // Mark as seen so landing page won't show again
      localStorage.setItem(SEEN_KEY, "true");
      setHasSeenDemo(true);
      setIsDemoMode(true);
    },
    []
  );

  const endDemo = useCallback(
    (replaceAllLeads: (leads: Lead[]) => void) => {
      const backup = localStorage.getItem(BACKUP_KEY);
      const realLeads: Lead[] = backup ? JSON.parse(backup) : [];
      // Restore real leads (may be empty for a brand-new user)
      replaceAllLeads(realLeads);
      localStorage.removeItem(BACKUP_KEY);
      setIsDemoMode(false);
    },
    []
  );

  const resetOnboarding = useCallback(
    (replaceAllLeads?: (leads: Lead[]) => void) => {
      // If currently in demo mode, exit cleanly first
      if (localStorage.getItem(BACKUP_KEY) !== null && replaceAllLeads) {
        const backup = localStorage.getItem(BACKUP_KEY);
        const realLeads: Lead[] = backup ? JSON.parse(backup) : [];
        replaceAllLeads(realLeads);
        localStorage.removeItem(BACKUP_KEY);
        setIsDemoMode(false);
      }
      localStorage.removeItem(SEEN_KEY);
      setHasSeenDemo(false);
    },
    []
  );

  const clearRealLeads = useCallback(
    (replaceAllLeads: (leads: Lead[]) => void) => {
      // Clear the persistent real leads key
      localStorage.removeItem(REAL_KEY);
      // Also update the backup to empty so endDemo restores to empty
      if (isDemoMode) {
        localStorage.setItem(BACKUP_KEY, JSON.stringify([]));
      } else {
        replaceAllLeads([]);
      }
    },
    [isDemoMode]
  );

  return (
    <OnboardingContext.Provider
      value={{ hasSeenDemo, isDemoMode, markDemoSeen, startDemo, endDemo, resetOnboarding, clearRealLeads }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
