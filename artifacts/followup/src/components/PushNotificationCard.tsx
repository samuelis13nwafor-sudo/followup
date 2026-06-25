import { Bell, BellOff, CheckCircle, RefreshCw, Smartphone } from "lucide-react";
import { usePushNotifications, type DiagInfo } from "@/hooks/usePushNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useDevDate } from "@/contexts/DevDateContext";

function DiagPanel({
  diagInfo,
  onRefresh,
}: {
  diagInfo: DiagInfo;
  onRefresh: () => void;
}) {
  const permLabel =
    diagInfo.notificationPermission === "granted"
      ? "granted"
      : diagInfo.notificationPermission === "denied"
        ? "denied"
        : diagInfo.notificationPermission === "default"
          ? "default (not asked)"
          : "unsupported";

  const permColor =
    diagInfo.notificationPermission === "granted"
      ? "text-emerald-700"
      : diagInfo.notificationPermission === "denied"
        ? "text-red-600"
        : "text-amber-600";

  const swLabel = !diagInfo.swSupported
    ? "unsupported"
    : diagInfo.swRegistered === null
      ? "checking…"
      : diagInfo.swRegistered
        ? "registered ✓"
        : "not registered ✗";

  const swColor =
    !diagInfo.swSupported || diagInfo.swRegistered === false
      ? "text-red-600"
      : diagInfo.swRegistered
        ? "text-emerald-700"
        : "text-slate-500";

  const subLabel =
    diagInfo.subscriptionActive === null
      ? "checking…"
      : diagInfo.subscriptionActive
        ? "active ✓"
        : "none";

  const subColor =
    diagInfo.subscriptionActive === true
      ? "text-emerald-700"
      : diagInfo.subscriptionActive === false
        ? "text-slate-500"
        : "text-slate-400";

  const vapidLabel =
    diagInfo.vapidKeyPresent === null
      ? "checking…"
      : diagInfo.vapidKeyPresent
        ? "yes ✓"
        : "no ✗";

  const vapidColor =
    diagInfo.vapidKeyPresent === true
      ? "text-emerald-700"
      : diagInfo.vapidKeyPresent === false
        ? "text-red-600"
        : "text-slate-400";

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-violet-800 tracking-wide">
          Push Diagnostics
        </span>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh diagnostics"
          className="p-1 rounded text-violet-400 hover:text-violet-700 hover:bg-violet-100 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-xs">
        <dt className="text-violet-500 whitespace-nowrap">Notification permission</dt>
        <dd className={`font-medium ${permColor}`}>{permLabel}</dd>

        <dt className="text-violet-500 whitespace-nowrap">Service worker</dt>
        <dd className={`font-medium ${swColor}`}>{swLabel}</dd>

        <dt className="text-violet-500 whitespace-nowrap">Push subscription</dt>
        <dd className={`font-medium ${subColor}`}>{subLabel}</dd>

        <dt className="text-violet-500 whitespace-nowrap">VAPID key</dt>
        <dd className={`font-medium ${vapidColor}`}>{vapidLabel}</dd>
      </dl>
    </div>
  );
}

export function PushNotificationCard() {
  const { user } = useAuth();
  const { devModeEnabled } = useDevDate();
  const {
    pushState,
    enable,
    dismiss,
    resetSubscription,
    sendTest,
    isSending,
    sendResult,
    sendError,
    enableStatus,
    enableError,
    diagInfo,
    refreshDiag,
  } = usePushNotifications(user?.id);

  const isEnabling = enableStatus === "loading";

  // Show the main push card unless: unsupported, dismissed, or subscribed with dev mode off
  const showMainCard =
    pushState !== "unsupported" &&
    pushState !== "dismissed" &&
    !(pushState === "subscribed" && !devModeEnabled);

  // Nothing to render at all
  if (!showMainCard && !devModeEnabled) return null;

  return (
    <div className="flex flex-col gap-2">
      {showMainCard && (
        <>
          {/* ── Subscribed — test button + error detail in dev mode ────────── */}
          {pushState === "subscribed" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="flex-1 text-xs font-semibold text-emerald-800">
                  Push notifications enabled
                </p>
                <button
                  type="button"
                  onClick={() => void sendTest()}
                  disabled={isSending}
                  className="rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 active:bg-emerald-100 text-emerald-800 font-semibold px-3.5 py-1.5 text-xs transition-colors cursor-pointer touch-manipulation whitespace-nowrap disabled:opacity-50"
                >
                  {isSending ? "Sending…" : "Send Test Push"}
                </button>
                {sendResult === "ok" && (
                  <span className="text-xs text-emerald-700 font-medium whitespace-nowrap">
                    Sent ✓
                  </span>
                )}
                {sendResult === "error" && (
                  <span className="text-xs text-red-600 font-medium whitespace-nowrap">
                    Failed
                  </span>
                )}
              </div>

              {/* Error detail + Re-enable button (dev mode only) */}
              {sendResult === "error" && sendError && devModeEnabled && (
                <div className="mt-2.5 ml-7 flex flex-col gap-2">
                  <p className="text-xs text-red-700 leading-snug bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {sendError}
                  </p>
                  <button
                    type="button"
                    onClick={() => void resetSubscription()}
                    className="self-start text-xs text-emerald-700 font-semibold hover:underline cursor-pointer touch-manipulation"
                  >
                    Re-enable notifications →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── iOS not installed to home screen ─────────────────────────── */}
          {pushState === "ios-not-installed" && (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 flex items-start gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                <Smartphone
                  className="text-white"
                  style={{ width: "1.125rem", height: "1.125rem" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-snug">
                  Enable push notifications
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Install FollowUp to your Home Screen first, then open it from
                  the Home Screen to enable notifications.
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
          )}

          {/* ── Permission blocked ────────────────────────────────────────── */}
          {pushState === "blocked" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 flex items-start gap-3 shadow-sm">
              <BellOff className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800 leading-snug">
                  Notifications blocked
                </p>
                <p className="text-xs text-amber-700/80 mt-0.5 leading-relaxed">
                  {enableError ??
                    "To get follow-up reminders, allow notifications for this site in your browser settings."}
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
          )}

          {/* ── Idle — offer to enable ────────────────────────────────────── */}
          {pushState === "idle" && (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center shrink-0">
                  <Bell
                    className="text-white"
                    style={{ width: "1.125rem", height: "1.125rem" }}
                  />
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
                    disabled={isEnabling}
                    className="rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold px-3.5 py-1.5 text-xs transition-colors cursor-pointer touch-manipulation whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isEnabling ? "Enabling…" : "Enable"}
                  </button>
                  {!isEnabling && (
                    <button
                      type="button"
                      onClick={dismiss}
                      aria-label="Dismiss"
                      className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer touch-manipulation"
                    >
                      <span className="text-lg leading-none">×</span>
                    </button>
                  )}
                </div>
              </div>
              {enableStatus === "error" && enableError && (
                <p className="mt-2.5 ml-12 text-xs text-red-600 leading-snug">
                  {enableError}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Dev-mode diagnostic panel ───────────────────────────────────────── */}
      {devModeEnabled && (
        <DiagPanel diagInfo={diagInfo} onRefresh={() => void refreshDiag()} />
      )}
    </div>
  );
}
