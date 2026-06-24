import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useLeads } from "@/hooks/useLeads";
import { useView } from "@/contexts/ViewContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowRight, Bell, Clock, NotebookPen,
  PlusCircle, CalendarCheck, Trophy,
  ShieldCheck, Smartphone, Zap,
} from "lucide-react";

const BENEFITS = [
  {
    icon: Bell,
    title: "See who needs attention today",
    description: "Your dashboard surfaces overdue and today's follow-ups front and centre, so nothing slips through.",
  },
  {
    icon: Clock,
    title: "Snooze follow-ups in one tap",
    description: "Not ready to call yet? Push a follow-up to tomorrow, next week, or whenever — right from the lead card.",
  },
  {
    icon: NotebookPen,
    title: "Keep notes and history for every lead",
    description: "Jot down what was discussed, track status changes, and review the full activity trail any time.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: PlusCircle,
    title: "Add a Lead",
    description: "Capture a customer's name, phone, and service in under 30 seconds. Never lose a contact again.",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    iconBg: "bg-emerald-100",
  },
  {
    step: "02",
    icon: CalendarCheck,
    title: "Schedule a Follow-Up",
    description: "Set a follow-up date, add notes, and track their status — from first contact to quote sent.",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    iconBg: "bg-blue-100",
  },
  {
    step: "03",
    icon: Trophy,
    title: "Win More Customers",
    description: "Follow up at the right time. FollowUp shows you exactly who to call today so no job goes cold.",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    iconBg: "bg-amber-100",
  },
];

const TRUST_SIGNALS = [
  {
    icon: Zap,
    label: "Set up in 60 seconds",
    desc: "No training, no complex setup. Just add your first lead and go.",
  },
  {
    icon: Smartphone,
    label: "Works on any device",
    desc: "Mobile-first design — check your leads from the job site or office.",
  },
  {
    icon: ShieldCheck,
    label: "Your data stays yours",
    desc: "No ads. No third-party selling. Your customer list is private.",
  },
];

function ProductMockup() {
  return (
    <div className="rounded-2xl border border-slate-200 shadow-2xl overflow-hidden bg-white">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 bg-white rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-400 truncate">
          app.followup.io/dashboard
        </div>
      </div>

      {/* App layout */}
      <div className="flex" style={{ height: 380 }}>
        {/* Sidebar */}
        <div className="w-44 border-r border-slate-100 bg-white flex flex-col p-3 shrink-0">
          <div className="font-bold text-sm text-slate-800 px-2 py-2 mb-2">FollowUp</div>
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold mb-1">
            <div className="w-3.5 h-3.5 rounded-sm bg-white/30" />
            Dashboard
          </div>
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg text-slate-500 text-xs mb-4">
            <div className="w-3.5 h-3.5 rounded-sm bg-slate-200" />
            Leads
          </div>
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold">
            <span>+</span>
            Add Lead
          </div>
        </div>

        {/* Main dashboard */}
        <div className="flex-1 bg-slate-50 p-4 overflow-hidden flex flex-col gap-3">
          <p className="text-base font-bold text-slate-800">Dashboard</p>

          {/* Mini summary stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Total Leads", value: "12", cls: "text-slate-800" },
              { label: "Due Today", value: "3", cls: "text-amber-600" },
              { label: "Won", value: "4", cls: "text-emerald-600" },
              { label: "Conversion", value: "44%", cls: "text-emerald-600" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="bg-white rounded-lg border border-slate-100 px-2.5 py-2 shadow-sm">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                <p className={`text-lg font-bold leading-none mt-0.5 ${cls}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Filter pills */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "Due Today", value: "3", active: false, border: "border-slate-200" },
              { label: "Overdue", value: "2", active: true, border: "border-red-300" },
              { label: "Total Open", value: "8", active: false, border: "border-slate-200" },
              { label: "Won", value: "4", active: false, border: "border-slate-200" },
            ].map(({ label, value, active, border }) => (
              <div key={label} className={`bg-white rounded-md border ${border} px-2 py-1.5 shadow-sm ${active ? "ring-1 ring-red-400 bg-red-50" : ""}`}>
                <p className={`text-[9px] font-semibold uppercase tracking-wide ${active ? "text-red-500" : "text-slate-400"}`}>{label}</p>
                <p className={`text-base font-bold leading-none ${active ? "text-red-500" : "text-slate-700"}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Lead cards */}
          <div className="space-y-1.5 flex-1 overflow-hidden">
            {[
              { name: "Maria Santos", service: "Deep house clean", badge: "Due Today", badgeCls: "bg-amber-100 text-amber-700" },
              { name: "James Holloway", service: "Brake pad replacement", badge: "Overdue", badgeCls: "bg-red-100 text-red-700" },
              { name: "David Kim", service: "Oil change & tire rotation", badge: "Won ✓", badgeCls: "bg-emerald-100 text-emerald-700" },
            ].map(({ name, service, badge, badgeCls }) => (
              <div key={name} className="flex items-center gap-3 bg-white rounded-lg border border-slate-100 px-3 py-2 shadow-sm">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
                  {name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{service}</p>
                </div>
                <span className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${badgeCls}`}>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const { leads, replaceAllLeads } = useLeads();
  const { setDensity } = useView();
  const { startDemo } = useOnboarding();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (user) return null;

  function handleStartDemo() {
    setDensity("comfortable");
    startDemo(replaceAllLeads, leads);
    navigate("/dashboard?demo=true");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      {/* Nav bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <span className="font-bold text-lg text-foreground tracking-tight">FollowUp</span>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Log in
            </span>
          </Link>
          <Link href="/signup">
            <span className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 text-sm transition-colors cursor-pointer">
              Sign up
            </span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 uppercase tracking-wide">
            Built for small service businesses
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight tracking-tight">
            Never forget a customer follow-up again.
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Track leads, follow-ups, notes, and next steps in one simple dashboard.
            Built for auto repair, cleaning services, barbers, tradespeople, and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/signup">
              <span className="flex items-center justify-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold px-6 py-3 text-sm transition-colors cursor-pointer touch-manipulation shadow-sm">
                Sign Up Free
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <button
              type="button"
              onClick={handleStartDemo}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-foreground font-semibold px-6 py-3 text-sm transition-colors cursor-pointer touch-manipulation"
            >
              Try Demo
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-emerald-700 hover:underline cursor-pointer font-medium">Log in</span>
            </Link>
          </p>
        </div>
      </section>

      {/* Product mockup */}
      <section className="px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Everything you need, in one clean dashboard
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              See your leads, stats, and follow-ups at a glance — no complex CRM required.
            </p>
          </div>
          <ProductMockup />
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest mb-2">Simple by design</p>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">How FollowUp works</h2>
            <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
              No training needed. Most businesses are up and running in under 5 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, description, iconBg }) => (
              <div key={step} className="relative flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-slate-700" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Step {step}</p>
                    <h3 className="font-bold text-foreground text-base leading-snug">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefit cards */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Built for the way you work</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Every feature is designed for service businesses, not Fortune 500 sales teams.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {BENEFITS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100">
                  <Icon className="h-4.5 w-4.5 text-emerald-700" style={{ width: "1.125rem", height: "1.125rem" }} />
                </div>
                <h3 className="font-semibold text-sm text-foreground leading-snug">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="px-6 py-14 bg-emerald-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Designed for real service businesses.
          </h2>
          <p className="text-emerald-200 text-sm mb-10 max-w-md mx-auto">
            Whether you're a one-person operation or a growing team, FollowUp keeps your pipeline organised without the CRM overwhelm.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {TRUST_SIGNALS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-1">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold text-white text-sm">{label}</p>
                <p className="text-emerald-200 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <Link href="/signup">
            <span className="inline-flex items-center gap-2 rounded-lg bg-white hover:bg-slate-50 text-emerald-800 font-bold px-8 py-3.5 text-sm transition-colors cursor-pointer touch-manipulation shadow-sm">
              Start Free — No Credit Card
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          <p className="text-emerald-300 text-xs mt-3">Set up in 60 seconds. No training needed.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-5 text-center text-xs text-muted-foreground">
        FollowUp — simple lead tracking for service businesses.
      </footer>
    </div>
  );
}
