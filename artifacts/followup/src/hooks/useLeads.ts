import { useState, useEffect, useCallback } from 'react';
import { getSeedLeads } from '../lib/leadUtils';

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
  followUpDate: string; // YYYY-MM-DD
  status: LeadStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

const STORAGE_KEY = 'followup_leads';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setLeads(JSON.parse(stored));
      } catch (e) {
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

  const addLead = useCallback((lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newLead: Lead = {
      ...lead,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveLeads([...leads, newLead]);
    return newLead;
  }, [leads, saveLeads]);

  const updateLead = useCallback((id: string, updates: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const newLeads = leads.map(l => 
      l.id === id 
        ? { ...l, ...updates, updatedAt: new Date().toISOString() }
        : l
    );
    saveLeads(newLeads);
  }, [leads, saveLeads]);

  const deleteLead = useCallback((id: string) => {
    saveLeads(leads.filter(l => l.id !== id));
  }, [leads, saveLeads]);

  const getLead = useCallback((id: string) => {
    return leads.find(l => l.id === id);
  }, [leads]);

  return {
    leads,
    isLoaded,
    addLead,
    updateLead,
    deleteLead,
    getLead,
  };
}
