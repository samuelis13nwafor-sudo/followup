import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Bell, BellOff, CheckCircle, Smartphone, Share,
  Download, ExternalLink, LogOut, Trash2, Save,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications, isPushSupported, isIOS, isIOSStandalone } from "@/hooks/usePushNotifications";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useToast } from "@/hooks/use-toast";

// ─── Constants ───────────────────────────────────────────────────────────────

const BUSINESS_TYPES = [
  "Auto repair",
  "Cleaning",
  "Electrical",
  "General contractor",
  "HVAC",
  "Landscaping",
  "Painting",
  "Plumbing",
  "Roofing",
  "Other",
];

const REMINDER_TIMES = [
  { label: "8:00 AM", value: "08:00" },
  { label: "9:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
];

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-0.5">
        {title}
      </h2>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

function Row({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-foreground mb-1.5">{children}</p>;
}

// ─── App install section ──────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let _installPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _installPrompt = e as BeforeInstallPromptEvent;
  });
}

function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function AppInstallRow() {
  const [installed, setInstalled] = useState(isInstalled);
  const [hasPrompt, setHasPrompt] = useState(() => !!_installPrompt);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (installed) return;
    const fn = (e: Event) => {
      e.preventDefault();
      _installPrompt = e as BeforeInstallPromptEvent;
      setHasPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", fn);
    return () => window.removeEventListener("beforeinstallprompt", fn);
  }, [installed]);

  if (installed) {
    return (
      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">FollowUp is installed</p>
          <p className="text-xs text-emerald-700/70 mt-0.5">Running as a home screen app.</p>
        </div>
      </div>
    );
  }

  if (hasPrompt) {
    return (
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Install FollowUp</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            Add to your home screen for one-tap access — no app store needed.
          </p>
        </div>
        <button
          type="button"
          disabled={installing}
          onClick={async () => {
            if (!_installPrompt) return;
            setInstalling(true);
            await _installPrompt.prompt();
            const { outcome } = await _installPrompt.userChoice;
            if (outcome === "accepted") setInstalled(true);
            setInstalling(false);
          }}
          className="shrink-0 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold px-4 py-1.5 text-sm transition-colors cursor-pointer touch-manipulation disabled:opacity-60"
        >
          {installing ? "Installing…" : "Install"}
        </button>
      </div>
    );
  }

  const ua = navigator.userAgent;
  const isIosDev = /iphone|ipad|ipod/i.test(ua);
  const isChrome = /CriOS/i.test(ua);

  if (isIosDev && isChrome) {
    return (
      <div className="flex items-start gap-3">
        <Smartphone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">Install on your iPhone</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Open <span className="font-semibold text-foreground">usefollowup.ca</span> in{" "}
            <span className="font-semibold text-foreground">Safari</span> to install FollowUp on your
            Home Screen.
          </p>
        </div>
      </div>
    );
  }

  if (isIosDev) {
    return (
      <div className="flex items-start gap-3">
        <Share className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">Install on your iPhone</p>
          <ol className="mt-2 space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <li>
              <span className="font-semibold text-foreground/50 mr-1.5">1.</span>
              Tap the <Share className="inline h-3 w-3 mx-0.5 relative top-px" />{" "}
              <span className="font-semibold text-foreground">Share</span> icon in Safari.
            </li>
            <li>
              <span className="font-semibold text-foreground/50 mr-1.5">2.</span>
              Tap <span className="font-semibold text-foreground">Add to Home Screen</span>.
            </li>
            <li>
              <span className="font-semibold text-foreground/50 mr-1.5">3.</span>
              Tap <span className="font-semibold text-foreground">Add</span>.
            </li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <Download className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-foreground">Install FollowUp</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
          Use your browser's install option to add FollowUp to your home screen.
        </p>
      </div>
    </div>
  );
}

// ─── Push status row ──────────────────────────────────────────────────────────

function PushStatusBadge({ state }: { state: string }) {
  if (state === "subscribed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
        Enabled
      </span>
    );
  }
  if (state === "blocked") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
        Blocked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 inline-block" />
      Not enabled
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Settings() {
  const { user, signOut } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { settings, isLoaded, isSaving, saveError, save } = useUserSettings(user?.id);

  // Local form state for the Business section (controlled separately from saved state)
  const [bizName, setBizName] = useState("");
  const [bizType, setBizType] = useState("");
  const [bizDirty, setBizDirty] = useState(false);
  const [bizSaved, setBizSaved] = useState(false);

  // Sync local form state once settings have loaded
  useEffect(() => {
    if (isLoaded) {
      setBizName(settings.businessName);
      setBizType(settings.businessType);
    }
  }, [isLoaded, settings.businessName, settings.businessType]);

  const push = usePushNotifications(user?.id);
  const isEnabling = push.enableStatus === "loading";

  async function handleSaveBusiness() {
    setBizSaved(false);
    const ok = await save({ ...settings, businessName: bizName, businessType: bizType });
    if (ok) {
      setBizDirty(false);
      setBizSaved(true);
      toast({ title: "Business settings saved" });
      setTimeout(() => setBizSaved(false), 2500);
    } else {
      toast({ title: "Save failed", description: saveError ?? "Please try again.", variant: "destructive" });
    }
  }

  async function handleReminderTime(value: string) {
    await save({ ...settings, reminderTime: value });
    toast({ title: "Reminder time updated" });
  }

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="space-y-8 max-w-xl">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      {/* ── Business ──────────────────────────────────────────────────────── */}
      <Section title="Business">
        <Row>
          <RowLabel>Business name</RowLabel>
          <input
            type="text"
            value={bizName}
            onChange={e => { setBizName(e.target.value); setBizDirty(true); setBizSaved(false); }}
            placeholder="e.g. Mike's Auto Repair"
            maxLength={80}
            className="w-full rounded-lg border bg-background px-3.5 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </Row>
        <Row>
          <RowLabel>Business type</RowLabel>
          <select
            value={bizType}
            onChange={e => { setBizType(e.target.value); setBizDirty(true); setBizSaved(false); }}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow cursor-pointer"
          >
            <option value="">Select type…</option>
            {BUSINESS_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {bizType && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Reminders and lead prompts will be tailored for a{" "}
              <span className="font-medium text-foreground">{bizType.toLowerCase()}</span> business.
            </p>
          )}
        </Row>
        <Row className="flex items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            {bizSaved ? (
              <span className="text-emerald-600 font-medium">✓ Saved</span>
            ) : saveError ? (
              <span className="text-red-600">{saveError}</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void handleSaveBusiness()}
            disabled={isSaving || (!bizDirty && !saveError)}
            className="flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground font-semibold px-4 py-2 text-sm transition-colors cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </Row>
      </Section>

      {/* ── Notifications ─────────────────────────────────────────────────── */}
      <Section title="Notifications">
        {/* Status */}
        <Row className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Push notifications</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {push.pushState === "subscribed"
                ? "You'll get a push when leads are due."
                : push.pushState === "blocked"
                  ? "Notifications are blocked in your browser settings."
                  : push.pushState === "unsupported"
                    ? "Not supported in this browser."
                    : "Enable to get reminders for due follow-ups."}
            </p>
          </div>
          <PushStatusBadge state={push.pushState} />
        </Row>

        {/* Enable button — shown when not yet subscribed and not blocked */}
        {push.pushState !== "subscribed" && push.pushState !== "blocked" && push.pushState !== "unsupported" && (
          <Row>
            {push.pushState === "ios-not-installed" ? (
              <div className="flex items-start gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-snug">
                  Install FollowUp to your Home Screen first, then open it from there to enable push notifications.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => void push.enable()}
                  disabled={isEnabling}
                  className="flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold px-4 py-2 text-sm transition-colors cursor-pointer touch-manipulation disabled:opacity-60"
                >
                  <Bell className="h-4 w-4" />
                  {isEnabling ? "Enabling…" : "Enable Push Notifications"}
                </button>
                {push.enableError && (
                  <p className="text-xs text-red-600">{push.enableError}</p>
                )}
              </div>
            )}
          </Row>
        )}

        {/* Blocked state */}
        {push.pushState === "blocked" && (
          <Row className="flex items-start gap-3">
            <BellOff className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-snug">
              Notifications are blocked. To enable them, go to your browser settings and allow notifications for this site.
            </p>
          </Row>
        )}

        {/* Test notification — shown when subscribed */}
        {push.pushState === "subscribed" && (
          <Row className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Send test notification</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sends a test push to this device right now.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {push.sendResult === "ok" && (
                <span className="text-xs text-emerald-700 font-medium">Sent ✓</span>
              )}
              {push.sendResult === "error" && (
                <span className="text-xs text-red-600 font-medium">Failed</span>
              )}
              <button
                type="button"
                onClick={() => void push.sendTest()}
                disabled={push.isSending}
                className="rounded-lg border border-border bg-background hover:bg-muted active:bg-muted/80 font-semibold px-4 py-1.5 text-sm transition-colors cursor-pointer touch-manipulation disabled:opacity-50 whitespace-nowrap"
              >
                {push.isSending ? "Sending…" : "Send Test"}
              </button>
            </div>
          </Row>
        )}

        {/* Reminder time */}
        <Row>
          <RowLabel>Daily reminder time</RowLabel>
          <p className="text-xs text-muted-foreground mb-3">
            When you'd like to receive your daily follow-up reminder.
          </p>
          <div className="flex flex-wrap gap-2">
            {REMINDER_TIMES.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => void handleReminderTime(value)}
                className={[
                  "rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer touch-manipulation",
                  settings.reminderTime === value
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-foreground border-border hover:bg-muted",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              disabled
              title="Coming soon"
              className="rounded-lg border px-4 py-1.5 text-sm font-medium text-muted-foreground border-border cursor-not-allowed opacity-50"
            >
              Custom
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground/70">
            Custom reminder times are coming soon. Automated daily reminders require the cron job to be enabled on the server.
          </p>
        </Row>
      </Section>

      {/* ── App ───────────────────────────────────────────────────────────── */}
      <Section title="App">
        <Row>
          <AppInstallRow />
        </Row>
      </Section>

      {/* ── Account ───────────────────────────────────────────────────────── */}
      <Section title="Account">
        <Row className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Email</p>
            <p className="text-sm font-medium text-foreground truncate">{user?.email ?? "—"}</p>
          </div>
        </Row>
        <Row>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex items-center gap-2 rounded-lg border border-border bg-background hover:bg-muted active:bg-muted/80 text-foreground font-semibold px-4 py-2 text-sm transition-colors cursor-pointer touch-manipulation"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </Row>
        <Row>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Delete account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently delete your account and all data.
              </p>
            </div>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="shrink-0 flex items-center gap-2 rounded-lg border border-red-200 text-red-400 font-semibold px-4 py-1.5 text-sm cursor-not-allowed opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </Row>
      </Section>

      {/* ── About ─────────────────────────────────────────────────────────── */}
      <Section title="About">
        <Row>
          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">App</dt>
              <dd className="font-medium text-foreground">FollowUp</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Version</dt>
              <dd className="font-medium text-foreground">V2 Beta</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Website</dt>
              <dd>
                <a
                  href="https://usefollowup.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  usefollowup.ca
                  <ExternalLink className="h-3 w-3" />
                </a>
              </dd>
            </div>
          </dl>
        </Row>
      </Section>
    </div>
  );
}
