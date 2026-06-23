import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, X, CheckCircle2 } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useLeads } from "@/hooks/useLeads";

interface Step {
  target: string | null;
  title: string;
  desc: string;
}

const STEPS: Step[] = [
  {
    target: "stat-cards",
    title: "Your follow-up dashboard",
    desc: "These cards show how many leads need attention today, who's overdue, and your overall pipeline — all at a glance.",
  },
  {
    target: "lead-list",
    title: "Leads that need attention",
    desc: "This section surfaces overdue and today's follow-ups — the people most likely to slip through the cracks.",
  },
  {
    target: "status-actions",
    title: "Update a lead in one tap",
    desc: "Mark a lead as Contacted, sent a Quote, Won, or Lost. Status updates are instant and logged automatically.",
  },
  {
    target: "snooze-actions",
    title: "Not ready to follow up? Snooze it.",
    desc: "Push the follow-up to tomorrow, in 3 days, or next week. It reappears on the right day so nothing is missed.",
  },
  {
    target: "notes-button",
    title: "Notes and activity history",
    desc: "Tap here to add notes and see a full log of every status change and update for this lead.",
  },
  {
    target: null,
    title: "You're ready.",
    desc: "The demo leads will be cleared now. Add your own leads to start tracking real follow-ups.",
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;

export function WalkthroughOverlay({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const [highlight, setHighlight] = useState<Rect | null>(null);
  const [, navigate] = useLocation();
  const { endDemo } = useOnboarding();
  const { replaceAllLeads } = useLeads();

  const isFinal = step === STEPS.length - 1;
  const current = STEPS[step];

  const measure = useCallback(() => {
    const { target } = STEPS[step];
    if (!target) {
      setHighlight(null);
      return;
    }
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

    const t = setTimeout(measure, 450);
    return () => clearTimeout(t);
  }, [step, measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  function exitDemo() {
    endDemo(replaceAllLeads);
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
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.52)",
        border: "2px solid #059669",
        pointerEvents: "none",
        zIndex: 49,
        transition: "top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease",
      }
    : undefined;

  return (
    <>
      {/* Backdrop for final step (no spotlight) */}
      {isFinal && (
        <div
          className="fixed inset-0 bg-black/50 z-48"
          style={{ zIndex: 48 }}
          onClick={exitDemo}
        />
      )}

      {/* Spotlight div */}
      {spotlightStyle && <div style={spotlightStyle} aria-hidden="true" />}

      {/* Skip button — always top-right */}
      {!isFinal && (
        <button
          type="button"
          onClick={exitDemo}
          className="fixed top-4 right-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow hover:bg-white transition-colors cursor-pointer touch-manipulation"
          style={{ zIndex: 52 }}
        >
          <X className="h-3 w-3" />
          Skip
        </button>
      )}

      {/* Bottom card — steps 0–4 */}
      {!isFinal && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl rounded-t-2xl px-5 pt-4 pb-safe"
          style={{ zIndex: 51, paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        >
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {STEPS.slice(0, -1).map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-4 h-2 bg-emerald-600"
                    : i < step
                    ? "w-2 h-2 bg-emerald-300"
                    : "w-2 h-2 bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Text */}
          <div className="mb-4 space-y-1">
            <p className="text-sm font-semibold text-foreground">{current.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.desc}</p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer touch-manipulation"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-sm font-semibold transition-colors cursor-pointer touch-manipulation"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Final centered card */}
      {isFinal && (
        <div
          className="fixed inset-0 flex items-center justify-center px-6"
          style={{ zIndex: 52 }}
        >
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
              onClick={exitDemo}
              className="w-full rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-3 text-sm transition-colors cursor-pointer touch-manipulation"
            >
              Start tracking my leads
            </button>
          </div>
        </div>
      )}
    </>
  );
}
