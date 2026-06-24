import { useState } from "react";
import { Sparkles, X, CheckCircle2 } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";

export function DemoBanner() {
  const { leads, clearDemoLeads } = useLeads();
  const [dismissed, setDismissed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const hasDemoLeads = leads.some((l) => l.is_demo);

  if (!hasDemoLeads || dismissed) return null;

  if (confirmed) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <p className="font-medium text-emerald-800">Your workspace is ready for real customers.</p>
      </div>
    );
  }

  function handleStartFresh() {
    clearDemoLeads();
    setConfirmed(true);
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm flex-wrap">
      <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
      <p className="flex-1 text-amber-900 min-w-0">
        You're exploring FollowUp with sample leads.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleStartFresh}
          className="rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold px-3 py-1.5 text-xs transition-colors cursor-pointer touch-manipulation"
        >
          Start Fresh
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex items-center gap-1 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 text-amber-800 font-medium px-3 py-1.5 text-xs transition-colors cursor-pointer touch-manipulation"
        >
          <X className="h-3 w-3" />
          Dismiss
        </button>
      </div>
    </div>
  );
}
