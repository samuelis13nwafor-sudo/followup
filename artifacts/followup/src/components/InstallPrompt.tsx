import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode =
      "standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true;

    if (isIos && !isInStandaloneMode) {
      const hiddenUntil = localStorage.getItem("followup_install_hidden_until");
      if (!hiddenUntil || Date.now() > Number(hiddenUntil)) {
        setShowIosHint(true);
      }
      return;
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, [dismissed]);

  function dismiss() {
    setDeferredPrompt(null);
    setShowIosHint(false);
    setDismissed(true);
    localStorage.setItem(
      "followup_install_hidden_until",
      String(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }

  if (dismissed) return null;

  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center shrink-0">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">Install FollowUp</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
              Add to your home screen for quick access.
            </p>
            <button
              type="button"
              onClick={install}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer touch-manipulation"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </button>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer touch-manipulation"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      </div>
    );
  }

  if (showIosHint) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center shrink-0">
            <Share className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">Install FollowUp</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
              Tap{" "}
              <span className="inline-flex items-center gap-0.5 font-semibold text-slate-700">
                <Share className="h-3 w-3 inline" /> Share
              </span>
              , then{" "}
              <span className="font-semibold text-slate-700">Add to Home Screen</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer touch-manipulation"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
