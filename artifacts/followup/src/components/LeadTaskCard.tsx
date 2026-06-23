import { useState } from "react";
import { Lead, LeadStatus } from "../hooks/useLeads";
import { useLeads } from "../hooks/useLeads";
import { useDevDate } from "@/contexts/DevDateContext";
import { addDaysToDate } from "../lib/leadUtils";
import { StatusBadge } from "./StatusBadge";
import { NotesModal } from "./NotesModal";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { Phone, MoreHorizontal, NotebookPen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface LeadTaskCardProps {
  lead: Lead;
  compact?: boolean;
}

const STATUS_ACTIONS: { label: string; status: LeadStatus; className: string }[] = [
  { label: "Contacted", status: "Contacted", className: "border-yellow-300 bg-yellow-50 text-yellow-800 active:bg-yellow-200 hover:bg-yellow-100" },
  { label: "Quote Sent", status: "Quote Sent", className: "border-orange-300 bg-orange-50 text-orange-800 active:bg-orange-200 hover:bg-orange-100" },
  { label: "Won", status: "Won", className: "border-green-300 bg-green-50 text-green-800 active:bg-green-200 hover:bg-green-100" },
  { label: "Lost", status: "Lost", className: "border-slate-300 bg-slate-50 text-slate-600 active:bg-slate-200 hover:bg-slate-100" },
];

const SNOOZE_OPTIONS = [
  { label: "Tomorrow", days: 1 },
  { label: "+3 days", days: 3 },
  { label: "+7 days", days: 7 },
];

export function LeadTaskCard({ lead, compact = false }: LeadTaskCardProps) {
  const { updateLead } = useLeads();
  const { getToday } = useDevDate();
  const { toast } = useToast();
  const today = getToday();
  const [notesOpen, setNotesOpen] = useState(false);

  const isOverdue = lead.followUpDate < today;
  const availableActions = STATUS_ACTIONS.filter(a => a.status !== lead.status);

  function handleStatus(status: LeadStatus) {
    updateLead(lead.id, { status });
    toast({ title: `Marked as ${status}`, description: lead.name });
  }

  function handleSnooze(days: number) {
    const newDate = addDaysToDate(today, days);
    updateLead(lead.id, { followUpDate: newDate });
    toast({
      title: "Follow-up snoozed",
      description: `${lead.name} — moved to ${format(parseISO(newDate), "MMM d")}`,
    });
  }

  const dateLabel = isOverdue
    ? `Overdue — ${format(parseISO(lead.followUpDate), "MMM d")}`
    : "Due Today";

  const actionsDropdown = (align: "end" | "start" = "end") => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer touch-manipulation"
          aria-label="Actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Mark as</DropdownMenuLabel>
        {availableActions.map((action) => (
          <DropdownMenuItem
            key={action.status}
            onSelect={() => handleStatus(action.status)}
            className="cursor-pointer text-sm"
          >
            {action.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Snooze</DropdownMenuLabel>
        {SNOOZE_OPTIONS.map(({ label, days }) => (
          <DropdownMenuItem
            key={days}
            onSelect={() => handleSnooze(days)}
            className="cursor-pointer text-sm"
          >
            {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setNotesOpen(true)} className="cursor-pointer text-sm">
          Notes
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/leads/${lead.id}`}>
            <span className="cursor-pointer text-sm w-full">View details</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (compact) {
    return (
      <div className="rounded-lg border bg-card shadow-sm">
        {/*
         * Mobile compact layout (<640px):
         * Compact mode is disabled on mobile until a better design is created.
         * On small screens we always render the Comfortable layout instead.
         */}
        <div className="sm:hidden p-3 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/leads/${lead.id}`}>
                <span className="font-semibold text-sm leading-tight hover:underline cursor-pointer line-clamp-1">
                  {lead.name}
                </span>
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{lead.service}</p>
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
              {dateLabel}
            </span>
          </div>

          <div className="border-t pt-2.5 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {availableActions.map((action) => (
                <button
                  key={action.status}
                  type="button"
                  onClick={() => handleStatus(action.status)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer touch-manipulation ${action.className}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Snooze:</span>
              {SNOOZE_OPTIONS.map(({ label, days }) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleSnooze(days)}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer touch-manipulation"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Notes preview / button */}
            <button
              type="button"
              onClick={() => setNotesOpen(true)}
              className={`w-full text-left rounded-md border px-3 py-2 text-xs transition-colors cursor-pointer touch-manipulation ${
                lead.notes
                  ? "border-amber-200 bg-amber-50 hover:bg-amber-100"
                  : "border-dashed border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <NotebookPen className={`h-3.5 w-3.5 shrink-0 ${lead.notes ? "text-amber-600" : "text-muted-foreground"}`} />
                {lead.notes ? (
                  <span className="text-amber-900 line-clamp-1">
                    <span className="font-medium">Note:</span> {lead.notes}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">Add note…</span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* ── Desktop/tablet compact layout (≥640px) — unchanged ── */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-2">
          {/* Name + service */}
          <div className="min-w-0 flex items-center gap-1.5 flex-1">
            <Link href={`/leads/${lead.id}`}>
              <span className="font-semibold text-sm leading-tight hover:underline cursor-pointer whitespace-nowrap">
                {lead.name}
              </span>
            </Link>
            <span className="text-muted-foreground text-xs">—</span>
            <span className="text-xs text-muted-foreground truncate">{lead.service}</span>
          </div>

          {/* Phone */}
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
          >
            <Phone className="h-3 w-3" />
            {lead.phone}
          </a>

          {/* Date */}
          <span className={`text-xs font-semibold shrink-0 ${isOverdue ? "text-destructive" : "text-foreground"}`}>
            {dateLabel}
          </span>

          {/* Status badge */}
          <div className="shrink-0">
            <StatusBadge status={lead.status} />
          </div>

          {/* Actions menu */}
          {actionsDropdown("end")}
        </div>

        <NotesModal lead={lead} open={notesOpen} onClose={() => setNotesOpen(false)} />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
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
            {dateLabel}
          </span>
        </div>

        {/* Notes preview — click to open editor */}
        <button
          type="button"
          onClick={() => setNotesOpen(true)}
          className={`w-full text-left rounded-md border px-3 py-2 text-xs transition-colors cursor-pointer touch-manipulation ${
            lead.notes
              ? "border-amber-200 bg-amber-50 hover:bg-amber-100"
              : "border-dashed border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <NotebookPen className={`h-3.5 w-3.5 shrink-0 ${lead.notes ? "text-amber-600" : "text-muted-foreground"}`} />
            {lead.notes ? (
              <span className="text-amber-900 line-clamp-1">
                <span className="font-medium">Note:</span> {lead.notes}
              </span>
            ) : (
              <span className="text-muted-foreground italic">Add note…</span>
            )}
          </div>
        </button>

        <div className="border-t pt-3 space-y-2.5">
          <div className="flex flex-wrap gap-1.5">
            {availableActions.map((action) => (
              <button
                key={action.status}
                type="button"
                onClick={() => handleStatus(action.status)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer touch-manipulation ${action.className}`}
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Snooze:</span>
            {SNOOZE_OPTIONS.map(({ label, days }) => (
              <button
                key={days}
                type="button"
                onClick={() => handleSnooze(days)}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer touch-manipulation"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <NotesModal lead={lead} open={notesOpen} onClose={() => setNotesOpen(false)} />
    </div>
  );
}
