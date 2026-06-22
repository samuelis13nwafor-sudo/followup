import { Lead, LeadStatus } from "../hooks/useLeads";
import { useLeads } from "../hooks/useLeads";
import { useDevDate } from "@/contexts/DevDateContext";
import { addDaysToDate } from "../lib/leadUtils";
import { StatusBadge } from "./StatusBadge";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { Phone } from "lucide-react";

interface LeadTaskCardProps {
  lead: Lead;
}

const STATUS_ACTIONS: { label: string; status: LeadStatus; className: string }[] = [
  { label: "Contacted", status: "Contacted", className: "border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100" },
  { label: "Quote Sent", status: "Quote Sent", className: "border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100" },
  { label: "Won", status: "Won", className: "border-green-300 bg-green-50 text-green-800 hover:bg-green-100" },
  { label: "Lost", status: "Lost", className: "border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100" },
];

export function LeadTaskCard({ lead }: LeadTaskCardProps) {
  const { updateLead } = useLeads();
  const { getToday } = useDevDate();
  const today = getToday();

  const isOverdue = lead.followUpDate < today;

  function handleStatus(status: LeadStatus) {
    updateLead(lead.id, { status });
  }

  function handleSnooze(days: number) {
    updateLead(lead.id, { followUpDate: addDaysToDate(today, days) });
  }

  const availableActions = STATUS_ACTIONS.filter(a => a.status !== lead.status);

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/leads/${lead.id}`}>
              <span className="font-semibold text-base leading-tight hover:underline cursor-pointer line-clamp-1">
                {lead.name}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{lead.service}</p>
          </div>
          <div className="shrink-0">
            <StatusBadge status={lead.status} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Phone className="h-3.5 w-3.5" />
            {lead.phone}
          </a>
          <span className={`text-xs font-semibold ${isOverdue ? "text-destructive" : "text-foreground"}`}>
            {isOverdue
              ? `Overdue — ${format(parseISO(lead.followUpDate), "MMM d")}`
              : "Due Today"}
          </span>
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {availableActions.map((action) => (
              <button
                key={action.status}
                onClick={() => handleStatus(action.status)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${action.className}`}
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Snooze:</span>
            {[
              { label: "Tomorrow", days: 1 },
              { label: "+3 days", days: 3 },
              { label: "+7 days", days: 7 },
            ].map(({ label, days }) => (
              <button
                key={days}
                onClick={() => handleSnooze(days)}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
