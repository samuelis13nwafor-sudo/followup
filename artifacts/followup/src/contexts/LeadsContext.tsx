import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSeedLeads } from "../lib/leadUtils";

export type LeadStatus = "New" | "Contacted" | "Quote Sent" | "Won" | "Lost";
export type LeadSource = "Walk-in" | "Referral" | "Phone call" | "Online" | "Social media" | "Other";

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
}

interface LeadsContextValue {
  leads: Lead[];
  isLoaded: boolean;
  addLead: (lead: Omit<Lead, "id" | "createdAt" | "updatedAt">) => Lead;
  updateLead: (id: string, updates: Partial<Omit<Lead, "id" | "createdAt" | "updatedAt">>) => void;
  deleteLead: (id: string) => void;
  getLead: (id: string) => Lead | undefined;
  replaceAllLeads: (newLeads: Lead[]) => void;
}

const LeadsContext = createContext<LeadsContextValue | null>(null);

const STORAGE_KEY = "followup_leads";

export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setLeads(JSON.parse(stored));
      } catch {
        setLeads([]);
      }
    } else {
      const seed = getSeedLeads();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      setLeads(seed);
    }
    setIsLoaded(true);
  }, []);

  const saveLeads = useCallback((newLeads: Lead[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLeads));
    setLeads(newLeads);
  }, []);

  const addLead = useCallback(
    (lead: Omit<Lead, "id" | "createdAt" | "updatedAt">) => {
      const newLead: Lead = {
        ...lead,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
    (id: string, updates: Partial<Omit<Lead, "id" | "createdAt" | "updatedAt">>) => {
      setLeads((prev) => {
        const updated = prev.map((l) =>
          l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
        );
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
