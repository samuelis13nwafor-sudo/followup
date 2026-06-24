import { useRef, useState, useEffect } from "react";
import { Bell, AlertCircle, Clock, Trophy, CheckCircle2 } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useDevDate } from "@/contexts/DevDateContext";
import { addDaysToDate } from "@/lib/leadUtils";
import { Lead } from "@/contexts/LeadsContext";

function daysDiff(from: string, to: string): number {
  return Math.floor(
    (new Date(to + "T12:00:00").getTime() - new Date(from + "T12:00:00").getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

interface NotifItem {
  lead: Lead;
  kind: "overdue" | "today" | "won";
  daysOverdue?: number;
}

export function NotificationBell() {
  const { leads } = useLeads();
  const { getToday } = useDevDate();
  const [isOpen, setIsOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = getToday();
  const sevenDaysAgo = addDaysToDate(today, -7);

  const activeLeads = leads.filter((l) => l.status !== "Won" && l.status !== "Lost");
  const overdueLeads = activeLeads.filter((l) => l.followUpDate < today);
  const todayLeads = activeLeads.filter((l) => l.followUpDate === today);
  const recentlyWon = leads.filter(
    (l) => l.status === "Won" && l.updatedAt.slice(0, 10) >= sevenDaysAgo
  );

  const totalCount = overdueLeads.length + todayLeads.length + recentlyWon.length;
  const badgeCount = totalCount;

  useEffect(() => {
    setSeen(false);
  }, [totalCount]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  function handleToggle() {
    if (!isOpen) {
      setSeen(true);
    }
    setIsOpen((o) => !o);
  }

  const notifications: NotifItem[] = [
    ...overdueLeads.slice(0, 5).map((lead) => ({
      lead,
      kind: "overdue" as const,
      daysOverdue: daysDiff(lead.followUpDate, today),
    })),
    ...todayLeads.slice(0, 5).map((lead) => ({ lead, kind: "today" as const })),
    ...recentlyWon.slice(0, 3).map((lead) => ({ lead, kind: "won" as const })),
  ];

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {!seen && badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 rounded-xl border border-border bg-white shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-slate-50/60">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {totalCount > 0 && (
              <span className="text-xs text-muted-foreground">{totalCount} active</span>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <p className="text-sm font-medium text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground">No overdue or upcoming follow-ups.</p>
              </div>
            ) : (
              <>
                {(overdueLeads.length > 0 || todayLeads.length > 0) && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Needs Action
                    </p>
                    {overdueLeads.slice(0, 5).map((lead) => {
                      const days = daysDiff(lead.followUpDate, today);
                      return (
                        <NotifRow
                          key={lead.id}
                          icon={<AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />}
                          name={lead.name}
                          service={lead.service}
                          meta={days === 1 ? "Overdue by 1 day" : `Overdue by ${days} days`}
                          metaColor="text-red-600"
                        />
                      );
                    })}
                    {todayLeads.slice(0, 5).map((lead) => (
                      <NotifRow
                        key={lead.id}
                        icon={<Clock className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />}
                        name={lead.name}
                        service={lead.service}
                        meta="Due today"
                        metaColor="text-amber-600"
                      />
                    ))}
                  </div>
                )}

                {recentlyWon.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Recently Won
                    </p>
                    {recentlyWon.slice(0, 3).map((lead) => (
                      <NotifRow
                        key={lead.id}
                        icon={<Trophy className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />}
                        name={lead.name}
                        service={lead.service}
                        meta="Marked as Won"
                        metaColor="text-emerald-600"
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifRow({
  icon,
  name,
  service,
  meta,
  metaColor,
}: {
  icon: React.ReactNode;
  name: string;
  service: string;
  meta: string;
  metaColor: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{service}</p>
        <p className={`text-xs font-medium mt-0.5 ${metaColor}`}>{meta}</p>
      </div>
    </div>
  );
}
