import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getSeedLeads } from "../lib/leadUtils";
import { format } from "date-fns";
import { useAuth } from "./AuthContext";

export type LeadStatus = "New" | "Contacted" | "Quote Sent" | "Won" | "Lost";
export type LeadSource = "Walk-in" | "Referral" | "Phone call" | "Online" | "Social media" | "Other";

export interface ActivityEntry {
  id: string;
  date: string;
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
  storageKey: string;
  addLead: (lead: Omit<Lead, "id" | "createdAt" | "updatedAt" | "activity">) => Lead;
  updateLead: (id: string, updates: Partial<Omit<Lead, "id" | "createdAt" | "updatedAt" | "activity">>) => void;
  deleteLead: (id: string) => void;
  getLead: (id: string) => Lead | undefined;
  replaceAllLeads: (newLeads: Lead[]) => void;
}

const LeadsContext = createContext<LeadsContextValue | null>(null);

const OLD_SHARED_KEY = "followup_leads";

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
  const { user, isLoading: authLoading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = user ? `followup_leads_${user.id}` : "followup_leads_demo";

  const storageKeyRef = useRef(storageKey);
  storageKeyRef.current = storageKey;

  useEffect(() => {
    if (authLoading) {
      setIsLoaded(false);
      return;
    }

    if (localStorage.getItem(OLD_SHARED_KEY) !== null) {
      localStorage.removeItem(OLD_SHARED_KEY);
    }

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed: Lead[] = JSON.parse(stored);
        setLeads(parsed.map(l => ({ ...l, activity: l.activity ?? [] })));
      } catch {
        setLeads([]);
      }
    } else {
      setLeads([]);
    }
    setIsLoaded(true);
  }, [authLoading, storageKey]);

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
        localStorage.setItem(storageKeyRef.current, JSON.stringify(updated));
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
        localStorage.setItem(storageKeyRef.current, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const deleteLead = useCallback((id: string) => {
    setLeads((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      localStorage.setItem(storageKeyRef.current, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getLead = useCallback(
    (id: string) => leads.find((l) => l.id === id),
    [leads]
  );

  const replaceAllLeads = useCallback((newLeads: Lead[]) => {
    localStorage.setItem(storageKeyRef.current, JSON.stringify(newLeads));
    setLeads(newLeads);
  }, []);

  return (
    <LeadsContext.Provider value={{ leads, isLoaded, storageKey, addLead, updateLead, deleteLead, getLead, replaceAllLeads }}>
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeadsContext() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeadsContext must be used within LeadsProvider");
  return ctx;
}
