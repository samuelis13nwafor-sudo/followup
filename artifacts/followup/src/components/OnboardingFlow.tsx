import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronRight, ChevronLeft, X, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLeads } from "@/hooks/useLeads";
import { addDaysToDate, getTodayDateString } from "@/lib/leadUtils";

type BusinessType = "Auto Repair" | "Cleaning Service" | "Barber / Salon" | "Driving School" | "Home Services" | "Other";
type FlowStep = 1 | 2 | 3;

const BUSINESS_TYPES: { label: BusinessType; emoji: string }[] = [
  { label: "Auto Repair", emoji: "🔧" },
  { label: "Cleaning Service", emoji: "🧹" },
  { label: "Barber / Salon", emoji: "✂️" },
  { label: "Driving School", emoji: "🚗" },
  { label: "Home Services", emoji: "🏠" },
  { label: "Other", emoji: "⚡" },
];

const SAMPLE_LEAD = {
  name: "John Smith",
  phone: "555-123-4567",
  service: "Brake Pad Replacement",
  followUpDate: addDaysToDate(getTodayDateString(), 1),
};

function ProgressDots({ step, total }: { step: FlowStep; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i + 1 === step
              ? "w-5 h-2 bg-emerald-600"
              : i + 1 < step
              ? "w-2 h-2 bg-emerald-300"
              : "w-2 h-2 bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

export function OnboardingFlow() {
  const [step, setStep] = useState<FlowStep>(1);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    phone: "",
    service: "",
    followUpDate: addDaysToDate(getTodayDateString(), 1),
  });
  const [saving, setSaving] = useState(false);
  const [, navigate] = useLocation();
  const { updateUserMeta } = useAuth();
  const { addLead } = useLeads();

  async function finish(opts: { withWalkthrough: boolean; leadToAdd?: typeof SAMPLE_LEAD }) {
    if (saving) return;
    setSaving(true);
    if (opts.leadToAdd) {
      addLead({
        name: opts.leadToAdd.name,
        phone: opts.leadToAdd.phone,
        service: opts.leadToAdd.service,
        followUpDate: opts.leadToAdd.followUpDate,
        source: "Other",
        notes: "",
        status: "New",
      });
    }
    try {
      await updateUserMeta({
        onboarding_completed: true,
        ...(businessType ? { business_type: businessType } : {}),
      });
    } catch {
      // best effort — metadata saved locally via setUser in updateUserMeta
    }
    navigate(opts.withWalkthrough ? "/dashboard?walkthrough=true" : "/dashboard");
  }

  async function skip() {
    await finish({ withWalkthrough: false });
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
          <div className="space-y-1">
            <p className="text-2xl font-bold tracking-tight text-emerald-700">FollowUp</p>
            <p className="text-xs text-muted-foreground tracking-wide uppercase">Lead tracking for service businesses</p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl select-none">
            👋
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Welcome to FollowUp</h1>
            <p className="text-muted-foreground leading-relaxed">
              Let's get you set up in under 60 seconds.
            </p>
          </div>

          <ProgressDots step={1} total={3} />

          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-3.5 text-base transition-colors cursor-pointer touch-manipulation"
            >
              Get Started
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={skip}
              disabled={saving}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-2 touch-manipulation"
            >
              Skip setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-white flex flex-col px-5 py-6 safe-top">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            onClick={skip}
            disabled={saving}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation"
          >
            <X className="h-3.5 w-3.5" />
            Skip
          </button>
        </div>

        <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">
          <div className="mb-6 space-y-4">
            <ProgressDots step={2} total={3} />
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">What type of business do you run?</h2>
              <p className="text-sm text-muted-foreground">We'll tailor the experience for you.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1">
            {BUSINESS_TYPES.map(({ label, emoji }) => {
              const selected = businessType === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setBusinessType(label)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-4 py-5 text-center transition-all cursor-pointer touch-manipulation ${
                    selected
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                      : "border-border bg-card text-foreground hover:border-emerald-300 hover:bg-emerald-50/50"
                  }`}
                >
                  <span className="text-2xl select-none">{emoji}</span>
                  <span className="text-sm font-semibold leading-tight">{label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!businessType}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-3.5 text-base transition-colors cursor-pointer touch-manipulation"
            >
              Continue
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    const canSubmit = draft.name.trim().length > 0;

    return (
      <div className="min-h-screen bg-white flex flex-col px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            onClick={skip}
            disabled={saving}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation"
          >
            <X className="h-3.5 w-3.5" />
            Skip
          </button>
        </div>

        <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">
          <div className="mb-6 space-y-4">
            <ProgressDots step={3} total={3} />
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">Add your first lead</h2>
              <p className="text-sm text-muted-foreground">Capture a real lead, or use a sample to explore.</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <label htmlFor="ob-name" className="text-sm font-medium text-foreground">Name</label>
              <input
                id="ob-name"
                type="text"
                autoComplete="off"
                placeholder="e.g. Sarah Chen"
                value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-3 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ob-phone" className="text-sm font-medium text-foreground">Phone</label>
              <input
                id="ob-phone"
                type="tel"
                autoComplete="off"
                placeholder="e.g. 555-0101"
                value={draft.phone}
                onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-3 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ob-service" className="text-sm font-medium text-foreground">Service</label>
              <input
                id="ob-service"
                type="text"
                autoComplete="off"
                placeholder="e.g. Brake pad replacement"
                value={draft.service}
                onChange={e => setDraft(d => ({ ...d, service: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-3 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ob-date" className="text-sm font-medium text-foreground">Follow-up date</label>
              <input
                id="ob-date"
                type="date"
                value={draft.followUpDate}
                onChange={e => setDraft(d => ({ ...d, followUpDate: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() =>
                finish({
                  withWalkthrough: true,
                  leadToAdd: {
                    name: draft.name.trim(),
                    phone: draft.phone.trim(),
                    service: draft.service.trim() || "Service",
                    followUpDate: draft.followUpDate,
                  },
                })
              }
              disabled={!canSubmit || saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-3.5 text-base transition-colors cursor-pointer touch-manipulation"
            >
              {saving ? "Saving…" : "Add Lead & Continue"}
              {!saving && <ChevronRight className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => finish({ withWalkthrough: true, leadToAdd: SAMPLE_LEAD })}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-white hover:bg-slate-50 text-foreground font-semibold px-4 py-3.5 text-base transition-colors cursor-pointer touch-manipulation"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              Use sample lead
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
