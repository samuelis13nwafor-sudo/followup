import { useLeads } from "../hooks/useLeads";
import { StatusBadge } from "../components/StatusBadge";
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayLeads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{overdueLeads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeLeads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Won Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{wonLeads.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Needs Attention</h2>
        {actionRequiredLeads.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">You are all caught up!</p>
              <p className="text-sm text-muted-foreground">No leads need follow-up today.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b bg-muted/40">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Service</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Phone</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Due</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {actionRequiredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted group cursor-pointer relative">
                      <td className="p-4 align-middle font-medium">
                        <Link href={`/leads/${lead.id}`} className="absolute inset-0 z-10" />
                        <span className="relative z-20 group-hover:underline">{lead.name}</span>
                      </td>
                      <td className="p-4 align-middle relative z-20">{lead.service}</td>
                      <td className="p-4 align-middle relative z-20">{lead.phone}</td>
                      <td className="p-4 align-middle relative z-20 font-medium">
                        {lead.followUpDate < today ? (
                          <span className="text-destructive font-semibold">Overdue ({format(parseISO(lead.followUpDate), 'MMM d')})</span>
                        ) : (
                          <span className="text-foreground">Today</span>
                        )}
                      </td>
                      <td className="p-4 align-middle relative z-20">
                        <StatusBadge status={lead.status as any} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
