import { useLocation } from "wouter";
import { useLeads } from "@/hooks/useLeads";
import { getSeedLeads } from "@/lib/leadUtils";
import { ArrowRight, Bell, Clock, NotebookPen } from "lucide-react";

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

export default function Landing() {
  const [, navigate] = useLocation();
  const { replaceAllLeads } = useLeads();

  function handleStartDemo() {
    replaceAllLeads(getSeedLeads());
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      {/* Nav bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <span className="font-bold text-lg text-foreground tracking-tight">FollowUp</span>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Go to Dashboard
        </button>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 uppercase tracking-wide">
            Built for small service businesses
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight tracking-tight">
            Never forget a customer follow-up again.
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Track leads, follow-ups, notes, and next steps in one simple dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={handleStartDemo}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold px-6 py-3 text-sm transition-colors cursor-pointer touch-manipulation shadow-sm"
            >
              Start Demo
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-foreground font-semibold px-6 py-3 text-sm transition-colors cursor-pointer touch-manipulation"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Benefit cards */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100">
                <Icon className="h-4.5 w-4.5 text-emerald-700" style={{ width: "1.125rem", height: "1.125rem" }} />
              </div>
              <h3 className="font-semibold text-sm text-foreground leading-snug">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-5 text-center text-xs text-muted-foreground">
        FollowUp — simple lead tracking for service businesses.
      </footer>
    </div>
  );
}
