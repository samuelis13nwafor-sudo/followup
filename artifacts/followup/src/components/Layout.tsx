import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, PlusCircle, Menu, FlaskConical, Zap, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useDevDate } from "@/contexts/DevDateContext";
import { useLeads } from "@/hooks/useLeads";
import { getSeedLeads } from "@/lib/leadUtils";
import { generateFakeLeads } from "@/lib/generateFakeLeads";
import { useToast } from "@/hooks/use-toast";

function DevPanel() {
  const { devModeEnabled, testDate, setDevModeEnabled, setTestDate, getToday } = useDevDate();
  const { replaceAllLeads } = useLeads();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  function handleGenerate() {
    setLoading("generate");
    const today = getToday();
    const fake = generateFakeLeads(50, today);
    replaceAllLeads(fake);
    toast({ title: "Generated 50 fake leads", description: "Dashboard and filters updated." });
    setLoading(null);
  }

  function handleClear() {
    replaceAllLeads([]);
    toast({ title: "All leads cleared" });
  }

  function handleReset() {
    replaceAllLeads(getSeedLeads());
    toast({ title: "Demo data restored" });
  }

  return (
    <div className={`mt-auto border-t pt-4 px-1 pb-2 transition-colors ${devModeEnabled ? "border-amber-300" : "border-border"}`}>
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-3">
        {/* Toggle row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-800">
            <FlaskConical className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider">Dev Mode</span>
          </div>
          <button
            type="button"
            onClick={() => setDevModeEnabled(!devModeEnabled)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${devModeEnabled ? "bg-amber-500" : "bg-slate-200"}`}
            role="switch"
            aria-checked={devModeEnabled}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${devModeEnabled ? "translate-x-4" : "translate-x-0"}`}
            />
          </button>
        </div>

        {devModeEnabled && (
          <>
            {/* Test date */}
            <div className="space-y-1.5">
              <label className="text-xs text-amber-700 font-medium">Test Date</label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full rounded-md border border-amber-300 bg-white px-2 py-1.5 text-xs text-amber-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <p className="text-xs text-amber-600 leading-snug">
                Dashboard uses this date instead of today.
              </p>
            </div>

            {/* Data tools */}
            <div className="space-y-1.5 border-t border-amber-200 pt-3">
              <p className="text-xs text-amber-700 font-medium">Test Data</p>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading === "generate"}
                className="w-full flex items-center gap-2 rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 active:bg-amber-200 transition-colors cursor-pointer disabled:opacity-60 touch-manipulation"
              >
                <Zap className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                {loading === "generate" ? "Generating…" : "Generate 50 Fake Leads"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full flex items-center gap-2 rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 active:bg-amber-200 transition-colors cursor-pointer touch-manipulation"
              >
                <RotateCcw className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                Reset Demo Data
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="w-full flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer touch-manipulation"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                Clear All Leads
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { devModeEnabled } = useDevDate();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Leads", href: "/leads", icon: Users },
  ];

  const NavLinks = ({ onNav }: { onNav?: () => void }) => (
    <>
      {navigation.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.name} href={item.href} onClick={onNav}>
            <div className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <item.icon className="h-4 w-4" />
              {item.name}
            </div>
          </Link>
        );
      })}
      <Link href="/leads/new" onClick={onNav}>
        <div className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer">
          <PlusCircle className="h-4 w-4" />
          Add Lead
        </div>
      </Link>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <aside className={`hidden w-64 flex-col border-r bg-sidebar md:flex transition-colors ${devModeEnabled ? "border-amber-200" : ""}`}>
        <div className="flex h-14 items-center border-b px-6 font-semibold text-lg text-sidebar-foreground shrink-0">
          FollowUp
          {devModeEnabled && (
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-300">
              DEV
            </span>
          )}
        </div>
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="p-4 shrink-0">
          <DevPanel />
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col">
              <div className="flex h-14 items-center border-b px-6 font-semibold text-lg text-sidebar-foreground shrink-0">
                FollowUp
                {devModeEnabled && (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-300">
                    DEV
                  </span>
                )}
              </div>
              <nav className="flex flex-col space-y-1 p-4 flex-1 overflow-y-auto">
                <NavLinks onNav={() => setOpen(false)} />
              </nav>
              <div className="p-4 shrink-0 overflow-y-auto max-h-[60vh]">
                <DevPanel />
              </div>
            </SheetContent>
          </Sheet>
          <div className="font-semibold text-lg flex items-center gap-2">
            FollowUp
            {devModeEnabled && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-300">
                DEV
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
