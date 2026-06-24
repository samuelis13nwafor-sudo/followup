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

type DashFilter =
  | "all" | "open" | "won" | "closed"
  | "today" | "overdue" | "snoozed" | "new"
  | null;

// ─── Unified filter card ────────────────────────────────────────────────────────

interface FilterCardProps {
  label: string;
  value: string | number;
  sub?: string;
  filterKey: DashFilter;
  activeFilter: DashFilter;
  onClick: (key: DashFilter) => void;
  valueCls?: string;
  labelCls?: string;
  activeBg?: string;
  activeBorder?: string;
  activeRing?: string;
  urgentBorder?: boolean;
}

function FilterCard({
  label, value, sub,
  filterKey, activeFilter, onClick,
  valueCls = "text-foreground",
  labelCls = "text-muted-foreground",
  activeBg = "bg-primary/5",
  activeBorder = "border-primary/40",
  activeRing = "ring-primary/50",
  urgentBorder = false,
}: FilterCardProps) {
  const isActive = activeFilter === filterKey;

  return (
    <button
      type="button"
      onClick={() => onClick(isActive ? null : filterKey)}
      aria-pressed={isActive}
      className={[
        "group rounded-xl border bg-card text-left shadow-sm w-full",
        "h-[88px] flex flex-col justify-between",
        "transition-all duration-150 cursor-pointer touch-manipulation",
        "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        urgentBorder && !isActive ? "border-red-200" : "",
        isActive
          ? `${activeBg} border-2 ${activeBorder} ring-1 ${activeRing} shadow-none translate-y-0`
          : "hover:border-slate-300",
      ].filter(Boolean).join(" ")}
    >
      <div className="px-4 pt-4">
        <p className={`text-xs font-semibold uppercase tracking-wide leading-none ${isActive ? "opacity-80" : labelCls}`}>
          {label}
        </p>
      </div>
      <div className="px-4 pb-4 flex items-end justify-between gap-2">
        <p className={`text-2xl font-bold tracking-tight leading-none ${valueCls}`}>{value}</p>
        {sub && (
          <p className="text-[10px] text-muted-foreground leading-tight text-right max-w-[88px]">{sub}</p>
        )}
      </div>
    </button>
  );
}

// ─── Filtered lead list section ─────────────────────────────────────────────────

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
  today: string;
  onClear: () => void;
  compact: boolean;
  search: string;
  onClearSearch: () => void;
}

function FilteredSection({ filter, leads, today, onClear, compact, search, onClearSearch }: FilteredSectionProps) {
  const activeLeads = leads.filter(l => l.status !== "Won" && l.status !== "Lost");
  const wonLeads    = leads.filter(l => l.status === "Won");
  const lostLeads   = leads.filter(l => l.status === "Lost");

  let baseLeads: Lead[];
  let title: string;
  let showBadge = false;

  switch (filter) {
    case "all":
      baseLeads = [...leads].sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
      title = "All Leads";
      break;
    case "open":
      baseLeads = activeLeads.slice().sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
      title = "Open Leads";
      break;
    case "won":
      baseLeads = wonLeads;
      title = "Won Customers";
      break;
    case "closed":
      baseLeads = [...wonLeads, ...lostLeads].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      title = "Closed Leads";
      break;
    case "today":
      baseLeads = activeLeads.filter(l => l.followUpDate === today);
      title = "Due Today";
      showBadge = true;
      break;
    case "overdue":
      baseLeads = activeLeads.filter(l => l.followUpDate < today)
        .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
      title = "Overdue";
      showBadge = true;
      break;
    case "snoozed":
      baseLeads = activeLeads.filter(l => l.followUpDate > today)
        .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
      title = "Snoozed";
      break;
    case "new":
      baseLeads = leads.filter(l => l.status === "New")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      title = "New Leads";
      break;
    default: {
      const overdue = activeLeads.filter(l => l.followUpDate < today)
        .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
      const todayLeads = activeLeads.filter(l => l.followUpDate === today);
      baseLeads = [...overdue, ...todayLeads];
      title = overdue.length > 0 ? "Overdue + Due Today" : "Due Today";
      showBadge = baseLeads.length > 0;
      break;
    }
  }

  const isSearchActive = search.trim().length > 0;
  const displayLeads = isSearchActive ? baseLeads.filter(l => matchesSearch(l, search.trim())) : baseLeads;

  const emptyMessages: Record<string, string> = {
    all:     "No leads yet.",
    open:    "No open leads.",
    won:     "No won leads yet.",
    closed:  "No closed leads yet.",
    today:   "No leads due today.",
    overdue: "No overdue leads — great work!",
    snoozed: "No snoozed leads.",
    new:     "No new leads.",
    default: "All caught up. No leads need follow-up today.",
  };
  const emptyMsg = emptyMessages[filter ?? "default"] ?? emptyMessages.default;

  return (
    <div className="space-y-4" data-walkthrough="lead-list">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
          {title}
          {showBadge && !isSearchActive && baseLeads.length > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold w-5 h-5 shrink-0">
              {baseLeads.length}
            </span>
          )}
          {(filter !== null || isSearchActive) && (
            <span className="text-sm font-normal text-muted-foreground">
              ({displayLeads.length})
            </span>
          )}
        </h2>
        <div className="flex items-center gap-3">
          {filter !== null && (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Clear filter
            </button>
          )}
          <Link href="/leads">
            <span className="text-sm text-primary hover:underline cursor-pointer">All leads →</span>
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

// ─── Main Dashboard ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { leads, isLoaded } = useLeads();
  const { getToday, devModeEnabled, testDate } = useDevDate();
  const { density, setDensity } = useView();
  const [activeFilter, setActiveFilter] = useState<DashFilter>(null);
  const [search, setSearch] = useState("");
  const searchStr = useSearch();
  const [, navigate] = useLocation();

  const isDemo      = new URLSearchParams(searchStr).get("demo") === "true";
  const isWalkthrough = new URLSearchParams(searchStr).get("walkthrough") === "true";

  if (!isLoaded) return null;

  const today       = getToday();
  const compact     = density === "compact";

  const activeLeads  = leads.filter(l => l.status !== "Won" && l.status !== "Lost");
  const wonLeads     = leads.filter(l => l.status === "Won");
  const todayLeads   = activeLeads.filter(l => l.followUpDate === today);
  const overdueLeads = activeLeads.filter(l => l.followUpDate < today);
  const snoozedLeads = activeLeads.filter(l => l.followUpDate > today);
  const newLeads     = leads.filter(l => l.status === "New");

  const conversionRate = leads.length > 0
    ? `${Math.round((wonLeads.length / leads.length) * 100)}%`
    : "0%";
  const conversionRateSub = `${wonLeads.length} won of ${leads.length} lead${leads.length !== 1 ? "s" : ""}`;

  function handleFilterClick(key: DashFilter) {
    setActiveFilter(key);
    setSearch("");
  }

  // Empty state
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
                <button type="button" className="mt-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-5 py-2.5 text-sm transition-colors cursor-pointer touch-manipulation">
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
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-3 flex-wrap">
            {devModeEnabled && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <span className="font-semibold">Time Travel</span>
                <span className="text-amber-500">·</span>
                <span className="font-mono font-semibold">{format(parseISO(testDate), "MMM d, yyyy")}</span>
              </div>
            )}
            <ViewToggle density={density} setDensity={setDensity} />
          </div>
        </div>

        <DemoBanner />

        {/* Row 1 — Business Metrics */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2.5 px-0.5">
            Business Metrics
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-walkthrough="stat-cards">
            <FilterCard
              label="Total Leads"
              value={leads.length}
              filterKey="all"
              activeFilter={activeFilter}
              onClick={handleFilterClick}
            />
            <FilterCard
              label="Open Leads"
              value={activeLeads.length}
              filterKey="open"
              activeFilter={activeFilter}
              onClick={handleFilterClick}
            />
            <FilterCard
              label="Won Customers"
              value={wonLeads.length}
              filterKey="won"
              activeFilter={activeFilter}
              onClick={handleFilterClick}
              valueCls="text-emerald-600"
              labelCls="text-emerald-700/70"
              activeBg="bg-emerald-50"
              activeBorder="border-emerald-500/50"
              activeRing="ring-emerald-400/40"
            />
            <FilterCard
              label="Conversion Rate"
              value={conversionRate}
              sub={conversionRateSub}
              filterKey="closed"
              activeFilter={activeFilter}
              onClick={handleFilterClick}
              valueCls={wonLeads.length > 0 ? "text-emerald-600" : "text-foreground"}
            />
          </div>
        </div>

        {/* Row 2 — Action Filters */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2.5 px-0.5">
            Action Filters
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FilterCard
              label="Due Today"
              value={todayLeads.length}
              filterKey="today"
              activeFilter={activeFilter}
              onClick={handleFilterClick}
              valueCls={todayLeads.length > 0 ? "text-amber-600" : "text-foreground"}
              labelCls={todayLeads.length > 0 ? "text-amber-600/80" : "text-muted-foreground"}
              activeBg="bg-amber-50"
              activeBorder="border-amber-400/50"
              activeRing="ring-amber-400/40"
            />
            <FilterCard
              label="Overdue"
              value={overdueLeads.length}
              filterKey="overdue"
              activeFilter={activeFilter}
              onClick={handleFilterClick}
              valueCls={overdueLeads.length > 0 ? "text-red-600" : "text-foreground"}
              labelCls={overdueLeads.length > 0 ? "text-red-600/80" : "text-muted-foreground"}
              activeBg="bg-red-50"
              activeBorder="border-red-400/50"
              activeRing="ring-red-400/40"
              urgentBorder={overdueLeads.length > 0}
            />
            <FilterCard
              label="Snoozed"
              value={snoozedLeads.length}
              filterKey="snoozed"
              activeFilter={activeFilter}
              onClick={handleFilterClick}
            />
            <FilterCard
              label="New Leads"
              value={newLeads.length}
              filterKey="new"
              activeFilter={activeFilter}
              onClick={handleFilterClick}
              valueCls={newLeads.length > 0 ? "text-blue-600" : "text-foreground"}
              labelCls={newLeads.length > 0 ? "text-blue-600/80" : "text-muted-foreground"}
              activeBg="bg-blue-50"
              activeBorder="border-blue-400/50"
              activeRing="ring-blue-400/40"
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative" data-walkthrough="dashboard-search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); if (e.target.value) setActiveFilter(null); }}
            placeholder="Search by name, phone, or service…"
            className="w-full rounded-lg border bg-card pl-9 pr-9 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
          {search && (
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
          today={today}
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

function ViewToggle({
  density,
  setDensity,
}: {
  density: "comfortable" | "compact";
  setDensity: (d: "comfortable" | "compact") => void;
}) {
  return (
    <div className="hidden sm:flex items-center rounded-lg border bg-card shadow-sm p-0.5 gap-0.5">
      <button
        type="button"
        onClick={() => setDensity("comfortable")}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${density === "comfortable" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
      >
        <AlignJustify className="h-3.5 w-3.5" />
        Comfortable
      </button>
      <button
        type="button"
        onClick={() => setDensity("compact")}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${density === "compact" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
      >
        <LayoutList className="h-3.5 w-3.5" />
        Compact
      </button>
    </div>
  );
}
