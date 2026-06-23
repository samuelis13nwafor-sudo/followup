import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSeedLeads } from "../lib/leadUtils";
import { format } from "date-fns";

export type LeadStatus = "New" | "Contacted" | "Quote Sent" | "Won" | "Lost";
export type LeadSource = "Walk-in" | "Referral" | "Phone call" | "Online" | "Social media" | "Other";

export interface ActivityEntry {
  id: string;
  date: string; // ISO timestamp
  message: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  service: string;
  source: LeadSource | string;
  notes: string;
  followUpDate: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  activity: ActivityEntry[];
}

interface LeadsContextValue {
  leads: Lead[];
  isLoaded: boolean;
  addLead: (lead: Omit<Lead, "id" | "createdAt" | "updatedAt" | "activity">) => Lead;
  updateLead: (id: string, updates: Partial<Omit<Lead, "id" | "createdAt" | "updatedAt" | "activity">>) => void;
  deleteLead: (id: string) => void;
  getLead: (id: string) => Lead | undefined;
  replaceAllLeads: (newLeads: Lead[]) => void;
}

const LeadsContext = createContext<LeadsContextValue | null>(null);

const STORAGE_KEY = "followup_leads";

function makeEntry(message: string): ActivityEntry {
  return { id: crypto.randomUUID(), date: new Date().toISOString(), message };
}

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "MMM d");
  } catch {
    return iso;
  }
}

export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: Lead[] = JSON.parse(stored);
        // Backfill activity array for leads that predate this feature
        setLeads(parsed.map(l => ({ ...l, activity: l.activity ?? [] })));
      } catch {
        setLeads([]);
      }
    } else {
      // New users start with an empty dashboard.
      // Demo data is loaded separately via startDemo() in OnboardingContext.
      setLeads([]);
    }
    setIsLoaded(true);
  }, []);

  const addLead = useCallback(
    (lead: Omit<Lead, "id" | "createdAt" | "updatedAt" | "activity">) => {
      const now = new Date().toISOString();
      const newLead: Lead = {
        ...lead,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        activity: [makeEntry("Lead created")],
      };
      setLeads((prev) => {
        const updated = [...prev, newLead];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      return newLead;
    },
    []
  );

  const updateLead = useCallback(
    (id: string, updates: Partial<Omit<Lead, "id" | "createdAt" | "updatedAt" | "activity">>) => {
      setLeads((prev) => {
        const updated = prev.map((l) => {
          if (l.id !== id) return l;

          const newEntries: ActivityEntry[] = [];

          if (updates.status !== undefined && updates.status !== l.status) {
            newEntries.push(makeEntry(`Status changed to ${updates.status}`));
          }
          if (updates.followUpDate !== undefined && updates.followUpDate !== l.followUpDate) {
            newEntries.push(makeEntry(`Follow-up date changed to ${formatDate(updates.followUpDate)}`));
          }
          if (updates.notes !== undefined && updates.notes !== l.notes) {
            newEntries.push(makeEntry("Note updated"));
          }

          return {
            ...l,
            ...updates,
            updatedAt: new Date().toISOString(),
            activity: [...(l.activity ?? []), ...newEntries],
          };
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const deleteLead = useCallback((id: string) => {
    setLeads((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getLead = useCallback(
    (id: string) => leads.find((l) => l.id === id),
    [leads]
  );

  const replaceAllLeads = useCallback((newLeads: Lead[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLeads));
    setLeads(newLeads);
  }, []);

  return (
    <LeadsContext.Provider value={{ leads, isLoaded, addLead, updateLead, deleteLead, getLead, replaceAllLeads }}>
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeadsContext() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeadsContext must be used within LeadsProvider");
  return ctx;
}
