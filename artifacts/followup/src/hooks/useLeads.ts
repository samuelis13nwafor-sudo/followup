// Re-export types and proxy to the shared LeadsContext.
// All components import from here — the context is the single source of truth.
export type { LeadStatus, LeadSource, Lead } from "../contexts/LeadsContext";
export { useLeadsContext as useLeads } from "../contexts/LeadsContext";
