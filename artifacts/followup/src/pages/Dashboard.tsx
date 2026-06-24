import { useState } from "react";
import { useLeads, Lead } from "../hooks/useLeads";
import { LeadTaskCard } from "../components/LeadTaskCard";
import { Link, useSearch, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { useDevDate } from "@/contexts/DevDateContext";
import { useView } from "@/contexts/ViewContext";
import { X, AlignJustify, LayoutList, Search } from "lucide-react";
import { WalkthroughOverlay } from "@/components/WalkthroughOverlay";
import { OnboardingWalkthrough } from "@/components/OnboardingWalkthrough";
import { DemoBanner } from "@/components/DemoBanner";

type DashFilter = "today" | "overdue" | "open" | "won" | null;

interface StatCardProps {
  label: string;
  value: number;
  filterKey: DashFilter;
  activeFilter: DashFilter;
  onClick: (key: DashFilter) => void;
  labelColor?: string;
  valueColor?: string;
  activeClass?: string;
  borderClass?: string;
}

function StatCard({
  label, value, filterKey, activeFilter, onClick,
  labelColor = "text-muted-foreground",
  valueColor = "text-foreground",
  activeClass = "ring-2 ring-primary bg-primary/5",
  borderClass = "",
}: StatCardProps) {
  const isActive = activeFilter === filterKey;
  return (
    <button
      onClick={() => onClick(isActive ? null : filterKey)}
      className={[
        "rounded-lg border bg-card text-left shadow-sm w-full transition-all duration-150",
        "hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5",
        "active:translate-y-0 active:shadow-sm active:scale-[0.98]",
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        borderClass,
        isActive ? activeClass : "",
      ].join(" ")}
      aria-pressed={isActive}
    >
      <div className="pb-1 pt-4 px-4">
        <p className={`text-xs font-semibold uppercase tracking-wide ${labelColor}`}>{label}</p>
      </div>
      <div className="px-4 pb-4">
        <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
      </div>
    </button>
  );
}

function matchesSearch(lead: Lead, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (
    lead.name.toLowerCase().includes(lower) ||
    lead.phone.toLowerCase().includes(lower) ||
    lead.service.toLowerCase().includes(lower)
  );
}

interface FilteredSectionProps {
  filter: DashFilter;
  leads: Lead[];
  todayLeads: Lead[];
  overdueLeads: Lead[];
  activeLeads: Lead[];
  wonLeads: Lead[];
  onClear: () => void;
  compact: boolean;
  search: string;
  onClearSearch: () => void;
}

function FilteredSection({
  filter, todayLeads, overdueLeads, activeLeads, wonLeads,
  onClear, compact, search, onClearSearch,
}: FilteredSectionProps) {
  let baseLeads: Lead[];
  let title: string;
  let badgeCount: number | null = null;

  switch (filter) {
    case "today":
      baseLeads = todayLeads;
      title = "Due Today";
      break;
    case "overdue":
      baseLeads = overdueLeads;
      title = "Overdue";
      break;
    case "open":
      baseLeads = activeLeads.slice().sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
      title = "All Open Leads";
      break;
    case "won":
      baseLeads = wonLeads;
      title = "Won Leads";
      break;
    default: {
      const actionRequired = [...overdueLeads, ...todayLeads].sort((a, b) =>
        a.followUpDate.localeCompare(b.followUpDate)
      );
      baseLeads = actionRequired;
      title = overdueLeads.length > 0 ? "Overdue + Today's Follow Ups" : "Today's Follow Ups";
      badgeCount = actionRequired.length > 0 ? actionRequired.length : null;
      break;
    }
  }

  const isSearchActive = search.trim().length > 0;
  const displayLeads = isSearchActive
    ? baseLeads.filter(l => matchesSearch(l, search.trim()))
    : baseLeads;

  const emptyMessages: Record<string, string> = {
    today: "No leads due today.",
    overdue: "No overdue leads. Nice work.",
    open: "No open leads.",
    won: "No won leads yet.",
    default: "All caught up. No leads need follow-up today.",
  };
  const emptyMsg = emptyMessages[filter ?? "default"] ?? emptyMessages.default;

  return (
    <div className="space-y-4" data-walkthrough="lead-list">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          {title}
          {badgeCount !== null && !isSearchActive && (
            <span className="inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold w-5 h-5">
              {badgeCount}
            </span>
          )}
          {(filter !== null || isSearchActive) && (
            <span className="text-sm font-normal text-muted-foreground">({displayLeads.length})</span>
          )}
        </h2>
        <div className="flex items-center gap-3">
          {filter !== null && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Show all
            </button>
          )}
          <Link href="/leads">
            <span className="text-sm text-primary hover:underline cursor-pointer">All leads</span>
          </Link>
        </div>
      </div>

      {displayLeads.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-2">
            {isSearchActive ? (
              <>
                <p className="text-base font-medium text-muted-foreground">
                  No results for &ldquo;{search.trim()}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </>
            ) : (
              <p className="text-base font-medium text-muted-foreground">{emptyMsg}</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={compact ? "space-y-1.5" : "space-y-3"}>
          {displayLeads.map((lead, idx) => (
            <LeadTaskCard key={lead.id} lead={lead} compact={compact} isFirst={idx === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { leads, isLoaded } = useLeads();
  const { getToday, devModeEnabled, testDate } = useDevDate();
  const { density, setDensity } = useView();
  const [activeFilter, setActiveFilter] = useState<DashFilter>(null);
  const [search, setSearch] = useState("");
  const searchStr = useSearch();
  const [, navigate] = useLocation();

  const isDemo = new URLSearchParams(searchStr).get("demo") === "true";
  const isWalkthrough = new URLSearchParams(searchStr).get("walkthrough") === "true";

  if (!isLoaded) return null;

  const today = getToday();
  const compact = density === "compact";
  const activeLeads = leads.filter(l => l.status !== "Won" && l.status !== "Lost");
  const wonLeads = leads.filter(l => l.status === "Won");
  const todayLeads = activeLeads.filter(l => l.followUpDate === today);
  const overdueLeads = activeLeads.filter(l => l.followUpDate < today);
  const isSearchActive = search.trim().length > 0;

  // Fully empty state — show a friendly CTA instead of the dashboard grid
  if (leads.length === 0) {
    return (
      <>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <p className="text-lg font-semibold text-foreground">No leads yet.</p>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Add your first lead to start tracking follow-ups.
              </p>
              <Link href="/leads/new">
                <button
                  type="button"
                  className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-5 py-2.5 text-sm transition-colors cursor-pointer touch-manipulation"
                >
                  Add your first lead
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
        {isDemo && <WalkthroughOverlay onFinish={() => navigate("/dashboard")} />}
        {isWalkthrough && <OnboardingWalkthrough onFinish={() => navigate("/dashboard")} />}
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-3 flex-wrap">
            {devModeEnabled && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <span className="font-semibold">Time Travel active</span>
                <span className="text-amber-600">—</span>
                <span>Showing as of <span className="font-mono font-semibold">{format(parseISO(testDate), "MMM d, yyyy")}</span></span>
              </div>
            )}
            <ViewToggle density={density} setDensity={setDensity} />
          </div>
        </div>

        <DemoBanner />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-walkthrough="stat-cards">
          <StatCard
            label="Due Today"
            value={todayLeads.length}
            filterKey="today"
            activeFilter={activeFilter}
            onClick={setActiveFilter}
            activeClass="ring-2 ring-primary bg-primary/5"
          />
          <StatCard
            label="Overdue"
            value={overdueLeads.length}
            filterKey="overdue"
            activeFilter={activeFilter}
            onClick={setActiveFilter}
            labelColor="text-destructive"
            valueColor="text-destructive"
            borderClass={overdueLeads.length > 0 ? "border-destructive/30" : ""}
            activeClass="ring-2 ring-destructive bg-destructive/5"
          />
          <StatCard
            label="Total Open"
            value={activeLeads.length}
            filterKey="open"
            activeFilter={activeFilter}
            onClick={setActiveFilter}
            activeClass="ring-2 ring-primary bg-primary/5"
          />
          <StatCard
            label="Won"
            value={wonLeads.length}
            filterKey="won"
            activeFilter={activeFilter}
            onClick={setActiveFilter}
            labelColor="text-emerald-600"
            valueColor="text-emerald-600"
            activeClass="ring-2 ring-emerald-600 bg-emerald-50"
          />
        </div>

        {/* Search bar — always visible, above lead list */}
        <div className="relative" data-walkthrough="dashboard-search">
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

        <FilteredSection
          filter={activeFilter}
          leads={leads}
          todayLeads={todayLeads}
          overdueLeads={overdueLeads}
          activeLeads={activeLeads}
          wonLeads={wonLeads}
          onClear={() => setActiveFilter(null)}
          compact={compact}
          search={search}
          onClearSearch={() => setSearch("")}
        />
      </div>

      {isDemo && <WalkthroughOverlay onFinish={() => navigate("/dashboard")} />}
      {isWalkthrough && <OnboardingWalkthrough onFinish={() => navigate("/dashboard")} />}
    </>
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
