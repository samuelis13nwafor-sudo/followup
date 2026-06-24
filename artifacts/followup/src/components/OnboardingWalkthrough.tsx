import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, X, CheckCircle2 } from "lucide-react";

interface Step {
  target: string | null;
  title: string;
  desc: string;
}

const STEPS: Step[] = [
  {
    target: "stat-cards",
    title: "Due Today & Overdue",
    desc: "These cards show which leads need attention right now. Tap any card to filter the list below.",
  },
  {
    target: "dashboard-search",
    title: "Search your leads",
    desc: "Find any lead instantly by name, phone number, or service. Results update as you type.",
  },
  {
    target: "sidebar-add-lead",
    title: "Add a lead",
    desc: "Tap here anytime to capture a new lead before you forget. It takes less than 30 seconds.",
  },
  {
    target: "mobile-menu-btn",
    title: "Navigation menu",
    desc: "On mobile, tap this to open navigation, access all leads, and manage your account.",
  },
  {
    target: null,
    title: "You're all set!",
    desc: "You know your way around. Start following up and never let a lead slip through the cracks again.",
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;

export function OnboardingWalkthrough({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const [highlight, setHighlight] = useState<Rect | null>(null);
  const [, navigate] = useLocation();

  const isFinal = step === STEPS.length - 1;
  const current = STEPS[step];

  const measure = useCallback(() => {
    const { target } = STEPS[step];
    if (!target) { setHighlight(null); return; }
    const el = document.querySelector(`[data-walkthrough="${target}"]`) as HTMLElement | null;
    if (!el) { setHighlight(null); return; }
    const r = el.getBoundingClientRect();
    setHighlight({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useEffect(() => {
    const { target } = STEPS[step];
    if (!target) { setHighlight(null); return; }
    const el = document.querySelector(`[data-walkthrough="${target}"]`) as HTMLElement | null;
    if (!el) { setHighlight(null); return; }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(measure, 420);
    return () => clearTimeout(t);
  }, [step, measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  function done() {
    onFinish();
    navigate("/dashboard");
  }

  const spotlightStyle: React.CSSProperties | undefined = highlight
    ? {
        position: "fixed",
        top: highlight.top - PAD,
        left: highlight.left - PAD,
        width: highlight.width + PAD * 2,
        height: highlight.height + PAD * 2,
        borderRadius: 10,
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.50)",
        border: "2px solid #059669",
        pointerEvents: "none",
        zIndex: 49,
        transition: "top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease",
      }
    : undefined;

  return (
    <>
      {!highlight && !isFinal && (
        <div className="fixed inset-0 bg-black/50" style={{ zIndex: 48 }} />
      )}
      {isFinal && (
        <div className="fixed inset-0 bg-black/50" style={{ zIndex: 48 }} onClick={done} />
      )}

      {spotlightStyle && <div style={spotlightStyle} aria-hidden="true" />}

      {!isFinal && (
        <button
          type="button"
          onClick={done}
          className="fixed top-4 right-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow hover:bg-white transition-colors cursor-pointer touch-manipulation"
          style={{ zIndex: 52 }}
        >
          <X className="h-3 w-3" />
          Skip
        </button>
      )}

      {!isFinal && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl rounded-t-2xl px-5 pt-4"
          style={{ zIndex: 51, paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {STEPS.slice(0, -1).map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-5 h-2 bg-emerald-600"
                    : i < step
                    ? "w-2 h-2 bg-emerald-300"
                    : "w-2 h-2 bg-slate-200"
                }`}
              />
            ))}
          </div>

          <div className="mb-4 space-y-1">
            <p className="text-sm font-semibold text-foreground">{current.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.desc}</p>
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer touch-manipulation"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer touch-manipulation"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {isFinal && (
        <div className="fixed inset-0 flex items-center justify-center px-6" style={{ zIndex: 52 }}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-7 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">{current.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{current.desc}</p>
            </div>
            <button
              type="button"
              onClick={done}
              className="w-full rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-3 text-sm transition-colors cursor-pointer touch-manipulation"
            >
              Start tracking my leads →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
