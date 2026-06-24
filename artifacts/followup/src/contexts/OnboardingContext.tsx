import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Lead } from "./LeadsContext";
import { getSeedLeads } from "../lib/leadUtils";
import { useAuth } from "./AuthContext";

const SEEN_KEY = "followup_hasSeenDemo";
const OLD_BACKUP_KEY = "followup_real_backup";
const DEMO_BACKUP_KEY = "followup_real_backup_demo";

function backupKey(userId: string | undefined): string {
  return userId ? `followup_real_backup_${userId}` : DEMO_BACKUP_KEY;
}

function realLeadsKey(userId: string | undefined): string {
  return userId ? `followup_leads_${userId}` : "followup_leads_demo";
}

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
  const { user } = useAuth();

  const [hasSeenDemo, setHasSeenDemo] = useState<boolean>(
    () => localStorage.getItem(SEEN_KEY) === "true"
  );

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (localStorage.getItem(DEMO_BACKUP_KEY) !== null) return true;
    if (localStorage.getItem(OLD_BACKUP_KEY) !== null) {
      localStorage.removeItem(OLD_BACKUP_KEY);
    }
    return false;
  });

  useEffect(() => {
    if (localStorage.getItem(OLD_BACKUP_KEY) !== null) {
      localStorage.removeItem(OLD_BACKUP_KEY);
    }
  }, []);

  const markDemoSeen = useCallback(() => {
    localStorage.setItem(SEEN_KEY, "true");
    setHasSeenDemo(true);
  }, []);

  const startDemo = useCallback(
    (replaceAllLeads: (leads: Lead[]) => void, currentLeads: Lead[]) => {
      const bKey = backupKey(user?.id);
      localStorage.setItem(bKey, JSON.stringify(currentLeads));
      replaceAllLeads(getSeedLeads());
      localStorage.setItem(SEEN_KEY, "true");
      setHasSeenDemo(true);
      setIsDemoMode(true);
    },
    [user?.id]
  );

  const endDemo = useCallback(
    (replaceAllLeads: (leads: Lead[]) => void) => {
      const bKey = backupKey(user?.id);
      const backup = localStorage.getItem(bKey);
      const realLeads: Lead[] = backup ? JSON.parse(backup) : [];
      replaceAllLeads(realLeads);
      localStorage.removeItem(bKey);
      localStorage.removeItem(DEMO_BACKUP_KEY);
      setIsDemoMode(false);
    },
    [user?.id]
  );

  const resetOnboarding = useCallback(
    (replaceAllLeads?: (leads: Lead[]) => void) => {
      const bKey = backupKey(user?.id);
      if (localStorage.getItem(bKey) !== null && replaceAllLeads) {
        const backup = localStorage.getItem(bKey);
        const realLeads: Lead[] = backup ? JSON.parse(backup) : [];
        replaceAllLeads(realLeads);
        localStorage.removeItem(bKey);
        setIsDemoMode(false);
      }
      localStorage.removeItem(SEEN_KEY);
      setHasSeenDemo(false);
    },
    [user?.id]
  );

  const clearRealLeads = useCallback(
    (replaceAllLeads: (leads: Lead[]) => void) => {
      const rKey = realLeadsKey(user?.id);
      localStorage.removeItem(rKey);
      if (isDemoMode) {
        const bKey = backupKey(user?.id);
        localStorage.setItem(bKey, JSON.stringify([]));
      } else {
        replaceAllLeads([]);
      }
    },
    [user?.id, isDemoMode]
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
