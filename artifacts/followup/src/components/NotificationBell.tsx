import { useRef, useState, useEffect, useCallback } from "react";
import { Bell, AlertCircle, Clock, Trophy, CheckCircle2, BellOff } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useDevDate } from "@/contexts/DevDateContext";
import { useAuth } from "@/contexts/AuthContext";
import { addDaysToDate } from "@/lib/leadUtils";
import { Lead } from "@/contexts/LeadsContext";
import { useLocation } from "wouter";

// ─── Types ──────────────────────────────────────────────────────────────────────

type NotifKind = "overdue" | "today" | "won";

interface NotifItem {
  id: string;          // `${lead.id}:${kind}` — stable, kind-specific
  lead: Lead;
  kind: NotifKind;
  meta: string;        // human-readable label
}

// ─── Storage helpers ─────────────────────────────────────────────────────────────

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<string>) {
  // Cap at 500 entries to avoid unbounded growth
  const arr = [...set].slice(-500);
  localStorage.setItem(key, JSON.stringify(arr));
}

// ─── Day diff util ───────────────────────────────────────────────────────────────

function daysDiff(from: string, to: string): number {
  return Math.floor(
    (new Date(to + "T12:00:00").getTime() - new Date(from + "T12:00:00").getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

// ─── Main component ──────────────────────────────────────────────────────────────

export function NotificationBell() {
  const { leads }     = useLeads();
  const { getToday }  = useDevDate();
  const { user }      = useAuth();
  const [, navigate]  = useLocation();

  const [isOpen, setIsOpen]       = useState(false);
  const [readIds, setReadIds]     = useState<Set<string>>(new Set());
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // User-scoped localStorage keys
  const userId    = user?.id ?? "anon";
  const readKey   = `followup_notif_read_${userId}`;
  const clearedKey = `followup_notif_cleared_${userId}`;

  // Load persisted state when userId becomes known
  useEffect(() => {
    setReadIds(loadSet(readKey));
    setClearedIds(loadSet(clearedKey));
  }, [readKey, clearedKey]);

  // ── Derive notifications from live lead data ────────────────────────────────
  const today        = getToday();
  const sevenDaysAgo = addDaysToDate(today, -7);
  const activeLeads  = leads.filter((l) => l.status !== "Won" && l.status !== "Lost");

  const allNotifications: NotifItem[] = [
    ...activeLeads
      .filter((l) => l.followUpDate < today)
      .slice(0, 8)
      .map((l) => {
        const days = daysDiff(l.followUpDate, today);
        return {
          id: `${l.id}:overdue`,
          lead: l,
          kind: "overdue" as const,
          meta: days === 1 ? "Overdue by 1 day" : `Overdue by ${days} days`,
        };
      }),
    ...activeLeads
      .filter((l) => l.followUpDate === today)
      .slice(0, 8)
      .map((l) => ({
        id: `${l.id}:today`,
        lead: l,
        kind: "today" as const,
        meta: "Follow-up due today",
      })),
    ...leads
      .filter((l) => l.status === "Won" && l.updatedAt.slice(0, 10) >= sevenDaysAgo)
      .slice(0, 5)
      .map((l) => ({
        id: `${l.id}:won`,
        lead: l,
        kind: "won" as const,
        meta: "Marked as Won",
      })),
  ];

  // Visible = not cleared by user
  const visibleNotifications = allNotifications.filter((n) => !clearedIds.has(n.id));
  // Unread = visible and not in readIds
  const unreadCount = visibleNotifications.filter((n) => !readIds.has(n.id)).length;

  // ── Click-outside to close ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  function markAllRead() {
    const next = new Set([...readIds, ...visibleNotifications.map((n) => n.id)]);
    setReadIds(next);
    saveSet(readKey, next);
  }

  function clearAll() {
    const nextCleared = new Set([...clearedIds, ...visibleNotifications.map((n) => n.id)]);
    const nextRead    = new Set([...readIds,    ...visibleNotifications.map((n) => n.id)]);
    setClearedIds(nextCleared);
    setReadIds(nextRead);
    saveSet(clearedKey, nextCleared);
    saveSet(readKey, nextRead);
  }

  const handleNotifClick = useCallback(
    (notif: NotifItem) => {
      // Mark this one as read
      const next = new Set([...readIds, notif.id]);
      setReadIds(next);
      saveSet(readKey, next);
      // Navigate to the lead
      navigate(`/leads/${notif.lead.id}`);
      setIsOpen(false);
    },
    [readIds, readKey, navigate]
  );

  function toggleOpen() {
    setIsOpen((o) => !o);
  }

  // ── Group visible notifications by section ────────────────────────────────────
  const visibleOverdue  = visibleNotifications.filter((n) => n.kind === "overdue");
  const visibleToday    = visibleNotifications.filter((n) => n.kind === "today");
  const visibleWon      = visibleNotifications.filter((n) => n.kind === "won");
  const hasActionItems  = visibleOverdue.length > 0 || visibleToday.length > 0;

  return (
    <div className="relative shrink-0" ref={containerRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className={[
          "relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer",
          isOpen
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
        ].join(" ")}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] px-0.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-[340px] rounded-xl border border-border bg-white shadow-xl z-50 flex flex-col overflow-hidden max-h-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-slate-50/80 shrink-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold h-4 px-1.5 leading-none">
                  {unreadCount} new
                </span>
              )}
            </div>
            {visibleNotifications.length > 0 && (
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 divide-y divide-border/50">
            {visibleNotifications.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {hasActionItems && (
                  <NotifSection label="Needs Action">
                    {visibleOverdue.map((n) => (
                      <NotifRow
                        key={n.id}
                        notif={n}
                        isUnread={!readIds.has(n.id)}
                        icon={<AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                        metaColor="text-red-600"
                        onClick={() => handleNotifClick(n)}
                      />
                    ))}
                    {visibleToday.map((n) => (
                      <NotifRow
                        key={n.id}
                        notif={n}
                        isUnread={!readIds.has(n.id)}
                        icon={<Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        metaColor="text-amber-600"
                        onClick={() => handleNotifClick(n)}
                      />
                    ))}
                  </NotifSection>
                )}

                {visibleWon.length > 0 && (
                  <NotifSection label="Recently Won 🎉">
                    {visibleWon.map((n) => (
                      <NotifRow
                        key={n.id}
                        notif={n}
                        isUnread={!readIds.has(n.id)}
                        icon={<Trophy className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                        metaColor="text-emerald-600"
                        onClick={() => handleNotifClick(n)}
                      />
                    ))}
                  </NotifSection>
                )}
              </>
            )}
          </div>

          {/* Footer hint */}
          {visibleNotifications.length > 0 && (
            <div className="px-4 py-2 border-t border-border/50 bg-slate-50/50 shrink-0">
              <p className="text-[11px] text-muted-foreground text-center">
                Click a notification to open that lead
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────────

function NotifSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      {children}
    </div>
  );
}

function NotifRow({
  notif,
  isUnread,
  icon,
  metaColor,
  onClick,
}: {
  notif: NotifItem;
  isUnread: boolean;
  icon: React.ReactNode;
  metaColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full flex items-start gap-3 px-4 py-2.5 text-left",
        "hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer",
        isUnread ? "bg-blue-50/30" : "",
      ].join(" ")}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground truncate">{notif.lead.name}</p>
          {isUnread && (
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" aria-label="Unread" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{notif.lead.service}</p>
        <p className={`text-xs font-medium mt-0.5 ${metaColor}`}>{notif.meta}</p>
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
        <BellOff className="h-5 w-5 text-emerald-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">All caught up</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          No overdue, due today, or recent wins to show.
        </p>
      </div>
    </div>
  );
}
