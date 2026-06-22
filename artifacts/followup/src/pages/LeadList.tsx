import { useState } from "react";
import { useLeads } from "../hooks/useLeads";
import { StatusBadge } from "../components/StatusBadge";
import { useDevDate } from "@/contexts/DevDateContext";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LeadList() {
  const { leads, isLoaded } = useLeads();
  const { getToday } = useDevDate();
  const [filter, setFilter] = useState("all");

  if (!isLoaded) return null;

  const today = getToday();
  const filteredLeads = leads.filter(lead => {
    if (filter === "all") return true;
    if (filter === "today") return lead.followUpDate === today && lead.status !== "Won" && lead.status !== "Lost";
    if (filter === "overdue") return lead.followUpDate < today && lead.status !== "Won" && lead.status !== "Lost";
    if (filter === "won") return lead.status === "Won";
    if (filter === "lost") return lead.status === "Lost";
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <Link href="/leads/new">
          <Button className="bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </Link>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="flex flex-wrap h-auto bg-muted/50 p-1">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Due Today</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="won">Won</TabsTrigger>
          <TabsTrigger value="lost">Lost</TabsTrigger>
        </TabsList>
      </Tabs>

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
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-32 text-center text-muted-foreground bg-muted/10">
                    No leads found for this filter.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted group cursor-pointer relative">
                    <td className="p-4 align-middle font-medium">
                      <Link href={`/leads/${lead.id}`} className="absolute inset-0 z-10" />
                      <span className="relative z-20 group-hover:underline">{lead.name}</span>
                    </td>
                    <td className="p-4 align-middle relative z-20">{lead.service}</td>
                    <td className="p-4 align-middle relative z-20">{lead.phone}</td>
                    <td className="p-4 align-middle relative z-20 text-muted-foreground">
                      {format(parseISO(lead.followUpDate), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 align-middle relative z-20">
                      <StatusBadge status={lead.status as any} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
