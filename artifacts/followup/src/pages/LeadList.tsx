import { useState } from "react";
import { useLeads, Lead, LeadStatus } from "../hooks/useLeads";
import { StatusBadge } from "../components/StatusBadge";
import { LeadTaskCard } from "../components/LeadTaskCard";
import { useDevDate } from "@/contexts/DevDateContext";
import { useView } from "@/contexts/ViewContext";
import { addDaysToDate } from "../lib/leadUtils";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { PlusCircle, AlignJustify, LayoutList } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_ACTIONS: { label: string; status: LeadStatus; className: string }[] = [
  { label: "Contacted", status: "Contacted", className: "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100" },
  { label: "Quote Sent", status: "Quote Sent", className: "border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100" },
  { label: "Won", status: "Won", className: "border-green-200 bg-green-50 text-green-800 hover:bg-green-100" },
  { label: "Lost", status: "Lost", className: "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100" },
];

function InlineActions({ lead }: { lead: Lead }) {
  const { updateLead } = useLeads();
  const { getToday } = useDevDate();
  const today = getToday();

  return (
    <div className="flex flex-wrap gap-1">
      {STATUS_ACTIONS.filter(a => a.status !== lead.status).map((action) => (
        <button
          key={action.status}
          onClick={(e) => { e.stopPropagation(); updateLead(lead.id, { status: action.status }); }}
          className={`rounded border px-2 py-0.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${action.className}`}
        >
          {action.label}
        </button>
      ))}
      <span className="text-muted-foreground text-xs self-center mx-0.5">|</span>
      {[{ label: "+1", days: 1 }, { label: "+3", days: 3 }, { label: "+7", days: 7 }].map(({ label, days }) => (
        <button
          key={days}
          onClick={(e) => { e.stopPropagation(); updateLead(lead.id, { followUpDate: addDaysToDate(today, days) }); }}
          className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          {label}d
        </button>
      ))}
    </div>
  );
}

function ViewToggle({ density, setDensity }: { density: "comfortable" | "compact"; setDensity: (d: "comfortable" | "compact") => void }) {
  return (
    <div className="flex items-center rounded-lg border bg-card shadow-sm p-0.5 gap-0.5">
      <button
        type="button"
        onClick={() => setDensity("comfortable")}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${density === "comfortable" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
        title="Comfortable view"
      >
        <AlignJustify className="h-3.5 w-3.5" />
        Comfortable
      </button>
      <button
        type="button"
        onClick={() => setDensity("compact")}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${density === "compact" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
        title="Compact view"
      >
        <LayoutList className="h-3.5 w-3.5" />
        Compact
      </button>
    </div>
  );
}

export default function LeadList() {
  const { leads, isLoaded } = useLeads();
  const { getToday } = useDevDate();
  const { density, setDensity } = useView();
  const [filter, setFilter] = useState("all");

  if (!isLoaded) return null;

  const today = getToday();
  const compact = density === "compact";

  const filteredLeads = leads.filter(lead => {
    if (filter === "all") return true;
    if (filter === "today") return lead.followUpDate === today && lead.status !== "Won" && lead.status !== "Lost";
    if (filter === "overdue") return lead.followUpDate < today && lead.status !== "Won" && lead.status !== "Lost";
    if (filter === "won") return lead.status === "Won";
    if (filter === "lost") return lead.status === "Lost";
    return true;
  }).sort((a, b) => {
    if (filter === "overdue" || filter === "today") {
      return a.followUpDate.localeCompare(b.followUpDate);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <ViewToggle density={density} setDensity={setDensity} />
          <Link href="/leads/new">
            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer h-9 px-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="flex flex-wrap h-auto bg-muted/50 p-1 gap-0.5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Due Today</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="won">Won</TabsTrigger>
          <TabsTrigger value="lost">Lost</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredLeads.length === 0 ? (
        <div className="rounded-lg border border-dashed flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <p className="font-medium">No leads in this view.</p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className={`md:hidden ${compact ? "space-y-1.5" : "space-y-3"}`}>
            {filteredLeads.map((lead) => (
              <LeadTaskCard key={lead.id} lead={lead} compact={compact} />
            ))}
          </div>

          {/* Desktop: table (comfortable) or compact cards */}
          {compact ? (
            <div className="space-y-1.5 hidden md:block">
              {filteredLeads.map((lead) => (
                <LeadTaskCard key={lead.id} lead={lead} compact={true} />
              ))}
            </div>
          ) : (
            <div className="hidden md:block rounded-md border bg-card shadow-sm overflow-hidden">
              <div className="w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="bg-muted/40 border-b">
                    <tr>
                      <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                      <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground">Service</th>
                      <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground">Phone</th>
                      <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground">Due</th>
                      <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                      <th className="h-11 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="border-b last:border-0 transition-colors hover:bg-muted/30 group">
                        <td className="p-3 align-middle font-medium">
                          <Link href={`/leads/${lead.id}`}>
                            <span className="hover:underline cursor-pointer">{lead.name}</span>
                          </Link>
                        </td>
                        <td className="p-3 align-middle text-muted-foreground">{lead.service}</td>
                        <td className="p-3 align-middle">
                          <a href={`tel:${lead.phone}`} className="hover:underline text-primary font-medium">
                            {lead.phone}
                          </a>
                        </td>
                        <td className="p-3 align-middle whitespace-nowrap">
                          {lead.followUpDate < today ? (
                            <span className="text-destructive font-semibold text-xs">
                              Overdue — {format(parseISO(lead.followUpDate), "MMM d")}
                            </span>
                          ) : lead.followUpDate === today ? (
                            <span className="font-semibold text-xs">Today</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              {format(parseISO(lead.followUpDate), "MMM d, yyyy")}
                            </span>
                          )}
                        </td>
                        <td className="p-3 align-middle">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="p-3 align-middle">
                          <InlineActions lead={lead} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
