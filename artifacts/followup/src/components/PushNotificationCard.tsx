import { Bell, BellOff, CheckCircle, Smartphone } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/contexts/AuthContext";

const isDev = import.meta.env.DEV;

export function PushNotificationCard() {
  const { user } = useAuth();
  const { pushState, enable, dismiss, sendTest, isSending, sendResult } =
    usePushNotifications(user?.id);

  // Never render if unsupported or snoozed or already subscribed (unless dev)
  if (pushState === "unsupported") return null;
  if (pushState === "dismissed") return null;
  if (pushState === "subscribed" && !isDev) return null;

  // ── Already subscribed (dev only) ────────────────────────────────────────
  if (pushState === "subscribed") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-3 shadow-sm">
        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
        <p className="flex-1 text-xs font-semibold text-emerald-800">
          Push notifications enabled
        </p>
        <button
          type="button"
          onClick={() => void sendTest()}
          disabled={isSending}
          className="rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 active:bg-emerald-100 text-emerald-800 font-semibold px-3 py-1.5 text-xs transition-colors cursor-pointer touch-manipulation whitespace-nowrap disabled:opacity-50"
        >
          {isSending ? "Sending…" : "Send Test Push"}
        </button>
        {sendResult === "ok" && (
          <span className="text-xs text-emerald-700 font-medium">Sent ✓</span>
        )}
        {sendResult === "error" && (
          <span className="text-xs text-red-600 font-medium">Failed</span>
        )}
      </div>
    );
  }

  // ── iOS PWA not installed ─────────────────────────────────────────────────
  if (pushState === "ios-not-installed") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 flex items-start gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-lg bg-slate-600 flex items-center justify-center shrink-0 mt-0.5">
          <Smartphone className="text-white" style={{ width: "1.125rem", height: "1.125rem" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-snug">
            Enable push notifications
          </p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Install FollowUp to your Home Screen first, then open it from the
            Home Screen to enable notifications.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="mt-2.5 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer touch-manipulation"
          >
            Maybe later
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer touch-manipulation"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
    );
  }

  // ── Notifications blocked in browser ─────────────────────────────────────
  if (pushState === "blocked") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 flex items-start gap-3 shadow-sm">
        <BellOff className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800 leading-snug">
            Notifications blocked
          </p>
          <p className="text-xs text-amber-700/80 mt-0.5 leading-relaxed">
            To get follow-up reminders, allow notifications for this site in your
            browser settings.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 p-1.5 text-amber-500 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer touch-manipulation"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
    );
  }

  // ── Idle — offer to enable ────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 flex items-center gap-3 shadow-sm">
      <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center shrink-0">
        <Bell className="text-white" style={{ width: "1.125rem", height: "1.125rem" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-snug">
          Enable push notifications
        </p>
        <p className="text-xs text-slate-500 mt-0.5 leading-snug">
          Get reminders when it's time to follow up.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => void enable()}
          className="rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold px-3.5 py-1.5 text-xs transition-colors cursor-pointer touch-manipulation whitespace-nowrap"
        >
          Enable
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer touch-manipulation"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
    </div>
  );
}
