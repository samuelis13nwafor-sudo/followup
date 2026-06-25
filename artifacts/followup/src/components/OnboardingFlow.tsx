import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronRight, ChevronLeft, Wrench, Sparkles, Scissors, Car, Home, Layers, type LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLeads } from "@/hooks/useLeads";
import { Lead } from "@/contexts/LeadsContext";
import { addDaysToDate, getTodayDateString } from "@/lib/leadUtils";

type BusinessType = "Auto Repair" | "Cleaning Service" | "Barber / Salon" | "Driving School" | "Home Services" | "Other";
type FlowStep = 1 | 2 | 3;

const BUSINESS_TYPES: { label: BusinessType; icon: LucideIcon; description: string }[] = [
  { label: "Auto Repair",      icon: Wrench,   description: "Track estimates, declined work, and customer callbacks." },
  { label: "Cleaning Service", icon: Sparkles, description: "Stay on top of quotes and follow-up visits." },
  { label: "Barber / Salon",   icon: Scissors, description: "Track inquiries, appointments, and repeat customers." },
  { label: "Driving School",   icon: Car,      description: "Manage lesson inquiries and package follow-ups." },
  { label: "Home Services",    icon: Home,     description: "Track estimates and customer communication." },
  { label: "Other",            icon: Layers,   description: "Flexible lead tracking for any service business." },
];

const SERVICE_PLACEHOLDER: Record<BusinessType, string> = {
  "Auto Repair":      "e.g. Brake pad replacement",
  "Cleaning Service": "e.g. Deep house cleaning",
  "Barber / Salon":   "e.g. Haircut & beard trim",
  "Driving School":   "e.g. Beginner driving lesson",
  "Home Services":    "e.g. Drywall repair",
  "Other":            "e.g. Customer follow-up",
};

function makeSampleLeads(businessType: BusinessType | null): Lead[] {
  const today = getTodayDateString();
  function daysAgoISO(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
  }
  function entry(msg: string, daysAgo = 0) {
    return { id: crypto.randomUUID(), date: daysAgoISO(daysAgo), message: msg };
  }
  function lead(
    name: string, phone: string, service: string, source: string,
    notes: string, followUpDate: string, status: Lead["status"],
    createdDaysAgo: number, updatedDaysAgo: number,
    activityEntries: { msg: string; daysAgo: number }[]
  ): Lead {
    return {
      id: crypto.randomUUID(),
      name, phone, service, source, notes, followUpDate, status,
      createdAt: daysAgoISO(createdDaysAgo),
      updatedAt: daysAgoISO(updatedDaysAgo),
      activity: activityEntries.map(({ msg, daysAgo }) => entry(msg, daysAgo)),
      is_demo: true,
    };
  }

  if (businessType === "Cleaning Service") {
    return [
      lead("Maria Santos", "555-0182", "Deep house clean — 3 bed", "Referral",
        "Referred by the Patel family. Needs a quote before end of week.",
        addDaysToDate(today, -2), "New", 3, 3, [{ msg: "Lead created", daysAgo: 3 }]),
      lead("Rachel Thompson", "555-0193", "End of tenancy clean", "Online",
        "Moving out at end of month. Wants full clean including oven and windows.",
        today, "New", 1, 1, [{ msg: "Lead created", daysAgo: 1 }]),
      lead("James Patel", "555-0177", "Weekly office clean — 5 desks", "Walk-in",
        "Small accountancy firm. Wants a regular weekly slot, preferably Friday morning.",
        addDaysToDate(today, 2), "Contacted", 5, 2,
        [{ msg: "Lead created", daysAgo: 5 }, { msg: "Status changed to Contacted", daysAgo: 2 }]),
      lead("Lucy Chen", "555-0164", "Post-renovation clean — full house", "Phone call",
        "Builders leaving next week. Sent a quote for £280. Awaiting decision.",
        addDaysToDate(today, 3), "Quote Sent", 7, 1,
        [{ msg: "Lead created", daysAgo: 7 }, { msg: "Status changed to Contacted", daysAgo: 5 },
         { msg: "Status changed to Quote Sent", daysAgo: 1 }]),
      lead("David Wilson", "555-0158", "Carpet steam clean — lounge & stairs", "Referral",
        "Booked and paid. Happy customer — follow up in 3 months for a repeat.",
        addDaysToDate(today, 90), "Won", 10, 3,
        [{ msg: "Lead created", daysAgo: 10 }, { msg: "Status changed to Contacted", daysAgo: 8 },
         { msg: "Status changed to Quote Sent", daysAgo: 6 }, { msg: "Status changed to Won", daysAgo: 3 }]),
    ];
  }

  if (businessType === "Barber / Salon") {
    return [
      lead("Marcus Thompson", "555-0191", "Haircut & beard trim", "Walk-in",
        "Regular-style cut, skin fade sides. Came in last Tuesday — wants to rebook.",
        addDaysToDate(today, -2), "New", 3, 3, [{ msg: "Lead created", daysAgo: 3 }]),
      lead("Sofia Rivera", "555-0175", "Balayage & blow-dry", "Instagram",
        "Saw the work on Instagram. Wants natural highlights. Budget around £120.",
        today, "New", 1, 1, [{ msg: "Lead created", daysAgo: 1 }]),
      lead("Jordan Lee", "555-0163", "Shape-up & line-up", "Referral",
        "Referred by Marcus. Books every 3 weeks. Confirmed appointment next Thursday.",
        addDaysToDate(today, 4), "Contacted", 5, 2,
        [{ msg: "Lead created", daysAgo: 5 }, { msg: "Status changed to Contacted", daysAgo: 2 }]),
      lead("Emma Davis", "555-0149", "Full colour & style", "Phone call",
        "Sent a quote for £95 including toner. Waiting on confirmation.",
        addDaysToDate(today, 3), "Quote Sent", 7, 1,
        [{ msg: "Lead created", daysAgo: 7 }, { msg: "Status changed to Contacted", daysAgo: 5 },
         { msg: "Status changed to Quote Sent", daysAgo: 1 }]),
      lead("Kai Okafor", "555-0158", "Beard shaping & hot towel shave", "Walk-in",
        "Booked and done. Loved it — coming back monthly.",
        addDaysToDate(today, 30), "Won", 10, 3,
        [{ msg: "Lead created", daysAgo: 10 }, { msg: "Status changed to Contacted", daysAgo: 8 },
         { msg: "Status changed to Won", daysAgo: 3 }]),
    ];
  }

  if (businessType === "Driving School") {
    return [
      lead("Kevin Park", "555-0174", "10-lesson driving package", "Online",
        "Enquired online. Spoke on the phone — very keen. Wants to start next week.",
        addDaysToDate(today, -2), "New", 4, 2, [{ msg: "Lead created", daysAgo: 4 }]),
      lead("Amy Chen", "555-0186", "Intensive 5-day course", "Referral",
        "Referred by a previous student. Test booked in 3 weeks. Needs crash course.",
        today, "New", 1, 1, [{ msg: "Lead created", daysAgo: 1 }]),
      lead("Daniel Webb", "555-0162", "Theory + 3 practical lessons", "Phone call",
        "Called to ask about theory support. Confirmed first lesson Saturday 10am.",
        addDaysToDate(today, 5), "Contacted", 5, 2,
        [{ msg: "Lead created", daysAgo: 5 }, { msg: "Status changed to Contacted", daysAgo: 2 }]),
      lead("Priya Sharma", "555-0151", "Refresher lesson — 2 hours", "Online",
        "Passed years ago but hasn't driven since. Sent quote for 2-hour refresher.",
        addDaysToDate(today, 3), "Quote Sent", 7, 1,
        [{ msg: "Lead created", daysAgo: 7 }, { msg: "Status changed to Contacted", daysAgo: 5 },
         { msg: "Status changed to Quote Sent", daysAgo: 1 }]),
      lead("Marcus Liu", "555-0158", "Motorway & dual carriageway lesson", "Referral",
        "Booked and completed. Very confident driver. Follow up for Pass Plus course.",
        addDaysToDate(today, 14), "Won", 10, 3,
        [{ msg: "Lead created", daysAgo: 10 }, { msg: "Status changed to Contacted", daysAgo: 8 },
         { msg: "Status changed to Won", daysAgo: 3 }]),
    ];
  }

  if (businessType === "Home Services") {
    return [
      lead("Robert Mills", "555-0191", "Drywall repair — living room", "Referral",
        "Large crack above fireplace. Came recommended by a neighbour. Needs quote ASAP.",
        addDaysToDate(today, -2), "New", 3, 3, [{ msg: "Lead created", daysAgo: 3 }]),
      lead("Sarah Johnson", "555-0178", "Kitchen tap replacement", "Phone call",
        "Dripping mixer tap. Has the replacement already — just needs fitting.",
        today, "New", 1, 1, [{ msg: "Lead created", daysAgo: 1 }]),
      lead("Dave Walsh", "555-0166", "Garden fence installation — 20m", "Online",
        "Enquired online. Site visit confirmed for next Tuesday. Rough quote £600.",
        addDaysToDate(today, 4), "Contacted", 5, 2,
        [{ msg: "Lead created", daysAgo: 5 }, { msg: "Status changed to Contacted", daysAgo: 2 }]),
      lead("Michelle Park", "555-0154", "Bathroom re-seal & caulking", "Walk-in",
        "Full shower re-seal. Sent quote for £85. She said she'd confirm by Friday.",
        addDaysToDate(today, 3), "Quote Sent", 7, 1,
        [{ msg: "Lead created", daysAgo: 7 }, { msg: "Status changed to Contacted", daysAgo: 5 },
         { msg: "Status changed to Quote Sent", daysAgo: 1 }]),
      lead("Tim Evans", "555-0158", "Exterior house painting", "Referral",
        "Booked and completed. Happy with the result. Check back next spring.",
        addDaysToDate(today, 180), "Won", 10, 3,
        [{ msg: "Lead created", daysAgo: 10 }, { msg: "Status changed to Contacted", daysAgo: 8 },
         { msg: "Status changed to Quote Sent", daysAgo: 6 }, { msg: "Status changed to Won", daysAgo: 3 }]),
    ];
  }

  if (businessType === "Other") {
    return [
      lead("James Holloway", "555-0191", "Initial consultation", "Referral",
        "Referred by an existing client. Looking for ongoing support. Follow up this week.",
        addDaysToDate(today, -2), "New", 3, 3, [{ msg: "Lead created", daysAgo: 3 }]),
      lead("Maria Santos", "555-0182", "Service quote — package deal", "Online",
        "Enquired online. Interested in a monthly package. Needs pricing.",
        today, "New", 1, 1, [{ msg: "Lead created", daysAgo: 1 }]),
      lead("Kevin Park", "555-0174", "Follow-up call scheduled", "Phone call",
        "Spoke briefly. Very interested. Confirmed a follow-up call Wednesday at 2pm.",
        addDaysToDate(today, 2), "Contacted", 5, 2,
        [{ msg: "Lead created", daysAgo: 5 }, { msg: "Status changed to Contacted", daysAgo: 2 }]),
      lead("Aisha Okafor", "555-0165", "Custom service package", "Referral",
        "Sent a tailored quote. Waiting to hear back — she mentioned a decision by Thursday.",
        addDaysToDate(today, 3), "Quote Sent", 6, 1,
        [{ msg: "Lead created", daysAgo: 6 }, { msg: "Status changed to Contacted", daysAgo: 4 },
         { msg: "Status changed to Quote Sent", daysAgo: 1 }]),
      lead("David Kim", "555-0158", "Ongoing monthly service", "Referral",
        "Signed up. Regular customer — check in next month to renew.",
        addDaysToDate(today, 30), "Won", 10, 3,
        [{ msg: "Lead created", daysAgo: 10 }, { msg: "Status changed to Contacted", daysAgo: 8 },
         { msg: "Status changed to Quote Sent", daysAgo: 6 }, { msg: "Status changed to Won", daysAgo: 3 }]),
    ];
  }

  // Default: Auto Repair
  return [
    lead("James Holloway", "555-0191", "Brake pad replacement", "Walk-in",
      "Dropped in asking about front and rear pads on a 2019 Honda Civic. Needs it done this week.",
      addDaysToDate(today, -2), "New", 3, 3, [{ msg: "Lead created", daysAgo: 3 }]),
    lead("Maria Santos", "555-0182", "Full vehicle inspection", "Phone call",
      "Called about a pre-purchase inspection on a used car. Wants it done before the weekend.",
      today, "New", 1, 1, [{ msg: "Lead created", daysAgo: 1 }]),
    lead("Kevin Park", "555-0174", "Tyre change — all 4", "Online",
      "Enquired online. Spoke on the phone — wants winter tyres fitted. Confirmed next Thursday.",
      addDaysToDate(today, 2), "Contacted", 5, 2,
      [{ msg: "Lead created", daysAgo: 5 }, { msg: "Status changed to Contacted", daysAgo: 2 }]),
    lead("Aisha Okafor", "555-0165", "Engine diagnostic", "Phone call",
      "Check engine light on. Sent a quote for £60 diagnostic. Waiting to hear back by Thursday.",
      addDaysToDate(today, 3), "Quote Sent", 6, 1,
      [{ msg: "Lead created", daysAgo: 6 }, { msg: "Status changed to Contacted", daysAgo: 4 },
       { msg: "Status changed to Quote Sent", daysAgo: 1 }]),
    lead("David Kim", "555-0158", "Oil change and tire rotation", "Referral",
      "Booked in and paid. Regular customer — check in next month.",
      addDaysToDate(today, 30), "Won", 10, 3,
      [{ msg: "Lead created", daysAgo: 10 }, { msg: "Status changed to Contacted", daysAgo: 8 },
       { msg: "Status changed to Quote Sent", daysAgo: 6 }, { msg: "Status changed to Won", daysAgo: 3 }]),
  ];
}

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
  const [addingOwnLead, setAddingOwnLead] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    phone: "",
    service: "",
    followUpDate: addDaysToDate(getTodayDateString(), 1),
  });
  const [saving, setSaving] = useState(false);
  const [, navigate] = useLocation();
  const { updateUserMeta } = useAuth();
  const { addLead, replaceAllLeads } = useLeads();

  async function saveMetaAndGo(path: string) {
    try {
      await updateUserMeta({
        onboarding_completed: true,
        ...(businessType ? { business_type: businessType } : {}),
      });
    } catch {
      // best effort
    }
    navigate(path);
  }

  async function chooseSampleLeads() {
    if (saving) return;
    setSaving(true);
    replaceAllLeads(makeSampleLeads(businessType));
    await saveMetaAndGo("/dashboard?walkthrough=true");
  }

  async function submitOwnLead() {
    if (saving) return;
    setSaving(true);
    addLead({
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      service: draft.service.trim() || "Service",
      followUpDate: draft.followUpDate,
      source: "Other",
      notes: "",
      status: "New",
    });
    await saveMetaAndGo("/dashboard?walkthrough=true");
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

          <div className="w-full">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-3.5 text-base transition-colors cursor-pointer touch-manipulation"
            >
              Get Started
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-white flex flex-col px-5 py-6 safe-top">
        <div className="flex items-center mb-5">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">
          <div className="mb-5 space-y-3">
            <ProgressDots step={2} total={3} />
            <div className="space-y-0.5">
              <h1 className="text-xl font-bold text-foreground">Welcome to FollowUp</h1>
              <p className="text-sm text-muted-foreground">Let's customize your workspace.</p>
            </div>
            <p className="text-sm font-semibold text-foreground pt-1">What type of business do you run?</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {BUSINESS_TYPES.map(({ label, icon: Icon, description }) => {
              const selected = businessType === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setBusinessType(label)}
                  className={[
                    "group flex flex-col gap-2 rounded-xl border-2 px-3.5 py-3.5 text-left",
                    "transition-all duration-150 cursor-pointer touch-manipulation",
                    selected
                      ? "border-emerald-600 bg-emerald-50 shadow-sm ring-1 ring-emerald-600/20"
                      : "border-border bg-card hover:border-emerald-400 hover:bg-emerald-50/50 hover:-translate-y-0.5 hover:shadow-sm",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        selected ? "text-emerald-600" : "text-muted-foreground group-hover:text-emerald-500"
                      }`}
                    />
                    <span className={`text-sm font-semibold leading-tight ${selected ? "text-emerald-900" : "text-foreground"}`}>
                      {label}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${selected ? "text-emerald-800/70" : "text-muted-foreground"}`}>
                    {description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!businessType}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-3.5 text-base transition-colors cursor-pointer touch-manipulation"
            >
              Continue
              <ChevronRight className="h-5 w-5" />
            </button>
            {!businessType && (
              <p className="text-center text-xs text-muted-foreground mt-2">Select a business type to continue</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 3 && addingOwnLead) {
    const canSubmit = draft.name.trim().length > 0;
    const servicePlaceholder = businessType ? SERVICE_PLACEHOLDER[businessType] : "e.g. Customer follow-up";
    return (
      <div className="min-h-screen bg-white flex flex-col px-5 py-6">
        <div className="flex items-center mb-6">
          <button
            type="button"
            onClick={() => setAddingOwnLead(false)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">
          <div className="mb-6 space-y-4">
            <ProgressDots step={3} total={3} />
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">Add your first lead</h2>
              <p className="text-sm text-muted-foreground">Capture a real customer you're currently following up with.</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <label htmlFor="ob-name" className="text-sm font-medium text-foreground">Name</label>
              <input
                id="ob-name"
                type="text"
                autoComplete="off"
                autoFocus
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
                placeholder={servicePlaceholder}
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

          <div className="mt-6">
            <button
              type="button"
              onClick={submitOwnLead}
              disabled={!canSubmit || saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-3.5 text-base transition-colors cursor-pointer touch-manipulation"
            >
              {saving ? "Saving…" : "Add Lead & Continue"}
              {!saving && <ChevronRight className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-white flex flex-col px-5 py-6">
        <div className="flex items-center mb-6">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">
          <div className="mb-8 space-y-4">
            <ProgressDots step={3} total={3} />
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">How would you like to get started?</h2>
              <p className="text-sm text-muted-foreground">You can always add real leads later.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <button
              type="button"
              onClick={chooseSampleLeads}
              disabled={saving}
              className="w-full text-left rounded-2xl border-2 border-emerald-600 bg-emerald-50 hover:bg-emerald-100/70 px-5 py-5 transition-all cursor-pointer touch-manipulation disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl select-none mt-0.5">🚀</div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-emerald-900 leading-snug">Explore with Sample Leads</p>
                  <p className="text-sm text-emerald-800/70 mt-1 leading-relaxed">
                    We'll create a few realistic leads so you can see how FollowUp works.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 group-hover:bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors">
                    {saving ? "Setting up…" : "Get started instantly"}
                    {!saving && <ChevronRight className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAddingOwnLead(true)}
              disabled={saving}
              className="w-full text-left rounded-2xl border-2 border-border bg-card hover:border-slate-300 hover:bg-slate-50/70 px-5 py-5 transition-all cursor-pointer touch-manipulation disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl select-none mt-0.5">➕</div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-foreground leading-snug">Start with My Own Lead</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Add your first customer now.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
