import { useLeads } from "../hooks/useLeads";
import { StatusBadge } from "../components/StatusBadge";
import { LeadTaskCard } from "../components/LeadTaskCard";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { useDevDate } from "@/contexts/DevDateContext";

export default function Dashboard() {
  const { leads, isLoaded } = useLeads();
  const { getToday, devModeEnabled, testDate } = useDevDate();

  if (!isLoaded) return null;

  const today = getToday();
  const activeLeads = leads.filter(l => l.status !== "Won" && l.status !== "Lost");
  const wonLeads = leads.filter(l => l.status === "Won");

  const todayLeads = activeLeads.filter(l => l.followUpDate === today);
  const overdueLeads = activeLeads.filter(l => l.followUpDate < today);
  const actionRequiredLeads = [...overdueLeads, ...todayLeads].sort((a, b) =>
    a.followUpDate.localeCompare(b.followUpDate)
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        {devModeEnabled && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <span className="font-semibold">Time Travel active</span>
            <span className="text-amber-600">—</span>
            <span>Showing as of <span className="font-mono font-semibold">{format(parseISO(testDate), "MMM d, yyyy")}</span></span>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Today</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-bold">{todayLeads.length}</div>
          </CardContent>
        </Card>
        <Card className={overdueLeads.length > 0 ? "border-destructive/40" : ""}>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-destructive uppercase tracking-wide">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-bold text-destructive">{overdueLeads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Open</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-bold">{activeLeads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Won</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-bold text-emerald-600">{wonLeads.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's task list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            {overdueLeads.length > 0 ? "Overdue + Today's Follow Ups" : "Today's Follow Ups"}
            {actionRequiredLeads.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold w-5 h-5">
                {actionRequiredLeads.length}
              </span>
            )}
          </h2>
          <Link href="/leads?filter=all">
            <span className="text-sm text-primary hover:underline cursor-pointer">All leads</span>
          </Link>
        </div>

        {actionRequiredLeads.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">All caught up.</p>
              <p className="text-sm text-muted-foreground mt-1">No leads need follow-up today.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {actionRequiredLeads.map((lead) => (
              <LeadTaskCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
