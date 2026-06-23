import { useState, useMemo } from "react";
import { useLeads, Lead, LeadStatus } from "../hooks/useLeads";
import { StatusBadge } from "../components/StatusBadge";
import { LeadTaskCard } from "../components/LeadTaskCard";
import { useDevDate } from "@/contexts/DevDateContext";
import { useView } from "@/contexts/ViewContext";
import { addDaysToDate } from "../lib/leadUtils";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { PlusCircle, AlignJustify, LayoutList, Search, X } from "lucide-react";
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
    // Hidden on mobile — compact mode is desktop/tablet only
    <div className="hidden sm:flex items-center rounded-lg border bg-card shadow-sm p-0.5 gap-0.5">
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

function matchesSearch(lead: Lead, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return (
    lead.name.toLowerCase().includes(q) ||
    lead.phone.toLowerCase().includes(q) ||
    lead.service.toLowerCase().includes(q)
  );
}

export default function LeadList() {
  const { leads, isLoaded } = useLeads();
  const { getToday } = useDevDate();
  const { density, setDensity } = useView();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const today = getToday();
  const compact = density === "compact";

  const afterFilter = useMemo(() => leads.filter(lead => {
    if (filter === "all") return true;
    if (filter === "today") return lead.followUpDate === today && lead.status !== "Won" && lead.status !== "Lost";
    if (filter === "overdue") return lead.followUpDate < today && lead.status !== "Won" && lead.status !== "Lost";
    if (filter === "won") return lead.status === "Won";
    if (filter === "lost") return lead.status === "Lost";
    return true;
  }), [leads, filter, today]);

  const filteredLeads = useMemo(() => afterFilter
    .filter(lead => matchesSearch(lead, search))
    .sort((a, b) => {
      if (filter === "overdue" || filter === "today") {
        return a.followUpDate.localeCompare(b.followUpDate);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }),
  [afterFilter, search, filter]);

  if (!isLoaded) return null;

  const isSearchActive = search.trim().length > 0;
  const showCount = isSearchActive || filter !== "all";

  return (
    <div className="space-y-4">
      {/* Header */}
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

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or service…"
          className="w-full rounded-lg border bg-card pl-9 pr-9 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
        />
        {isSearchActive && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v)} className="w-full">
        <TabsList className="flex flex-wrap h-auto bg-muted/50 p-1 gap-0.5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Due Today</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="won">Won</TabsTrigger>
          <TabsTrigger value="lost">Lost</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Count line */}
      {showCount && filteredLeads.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredLeads.length}</span> of{" "}
          <span className="font-semibold text-foreground">{leads.length}</span> leads
          {isSearchActive && (
            <> for <span className="font-semibold text-foreground">&ldquo;{search.trim()}&rdquo;</span></>
          )}
        </p>
      )}

      {/* Results */}
      {filteredLeads.length === 0 ? (
        <div className="rounded-lg border border-dashed flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          {isSearchActive ? (
            <>
              <p className="font-medium">No matching leads found</p>
              <p className="text-sm mt-1">
                No results for &ldquo;{search.trim()}&rdquo;
                {filter !== "all" && " in this filter"}.
              </p>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-3 text-sm text-primary hover:underline cursor-pointer"
              >
                Clear search
              </button>
            </>
          ) : (
            <p className="font-medium">No leads in this view.</p>
          )}
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
