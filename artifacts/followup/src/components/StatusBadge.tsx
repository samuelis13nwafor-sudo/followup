import { Badge } from "@/components/ui/badge";
import { LeadStatus } from "../hooks/useLeads";

export function StatusBadge({ status }: { status: LeadStatus }) {
  let colorClass = "";
  
  switch (status) {
    case "New":
      colorClass = "bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-transparent";
      break;
    case "Contacted":
      colorClass = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 border-transparent";
      break;
    case "Quote Sent":
      colorClass = "bg-orange-100 text-orange-800 hover:bg-orange-100/80 border-transparent";
      break;
    case "Won":
      colorClass = "bg-green-100 text-green-800 hover:bg-green-100/80 border-transparent";
      break;
    case "Lost":
      colorClass = "bg-slate-100 text-slate-800 hover:bg-slate-100/80 border-transparent";
      break;
  }

  return (
    <Badge className={`font-medium ${colorClass}`}>
      {status}
    </Badge>
  );
}
