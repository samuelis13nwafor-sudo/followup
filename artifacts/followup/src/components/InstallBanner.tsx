import { useEffect, useState } from "react";
import { X, Download, Share, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Capture the prompt at module scope so it's available even if the component
// mounts after the event fires (which happens on fast page loads).
let _capturedPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _capturedPrompt = e as BeforeInstallPromptEvent;
  });
}

const DISMISS_KEY = "followup_install_hidden_until";
const SNOOZE_DAYS = 14;

function isAlreadyInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isDismissed(): boolean {
  const val = localStorage.getItem(DISMISS_KEY);
  if (!val) return false;
  return Date.now() < Number(val);
}

function snooze() {
  localStorage.setItem(
    DISMISS_KEY,
    String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000)
  );
}

type Platform = "android-desktop" | "ios-safari" | "ios-chrome" | "unknown";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  if (!isIos) return "android-desktop";
  const isChrome = /CriOS/i.test(ua);
  return isChrome ? "ios-chrome" : "ios-safari";
}

export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isAlreadyInstalled() || isDismissed()) return;

    const p = detectPlatform();
    setPlatform(p);

    if (p === "android-desktop") {
      // Use already-captured prompt if available, or wait for the event.
      if (_capturedPrompt) {
        setPrompt(_capturedPrompt);
        setVisible(true);
      } else {
        function onPrompt(e: Event) {
          e.preventDefault();
          _capturedPrompt = e as BeforeInstallPromptEvent;
          setPrompt(_capturedPrompt);
          setVisible(true);
        }
        window.addEventListener("beforeinstallprompt", onPrompt);
        return () => window.removeEventListener("beforeinstallprompt", onPrompt);
      }
    } else {
      // iOS — always show the instructions (Safari or Chrome message)
      setVisible(true);
    }
  }, []);

  function dismiss() {
    snooze();
    setVisible(false);
  }

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setVisible(false);
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 365 * 24 * 60 * 60 * 1000));
    }
  }

  if (!visible || installed) return null;

  // ── Android / Desktop ────────────────────────────────────────────────────
  if (platform === "android-desktop") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center shrink-0">
          <Download className="h-4.5 w-4.5 text-white" style={{ width: "1.125rem", height: "1.125rem" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-900 leading-snug">
            Install FollowUp on this device
          </p>
          <p className="text-xs text-emerald-800/70 mt-0.5 leading-snug">
            Add to your home screen for one-tap access — no app store needed.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={install}
            className="rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold px-3.5 py-1.5 text-xs transition-colors cursor-pointer touch-manipulation whitespace-nowrap"
          >
            Install
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 transition-colors cursor-pointer touch-manipulation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── iOS Chrome ───────────────────────────────────────────────────────────
  if (platform === "ios-chrome") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 flex items-start gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
          <Smartphone className="h-4.5 w-4.5 text-white" style={{ width: "1.125rem", height: "1.125rem" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-snug">
            Add FollowUp to your Home Screen
          </p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Open this page in <span className="font-semibold text-slate-700">Safari</span> to add FollowUp to your iPhone home screen.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="mt-2 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer touch-manipulation"
          >
            Maybe later
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer touch-manipulation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // ── iOS Safari ───────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 flex items-start gap-3 shadow-sm">
      <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
        <Share className="h-4.5 w-4.5 text-white" style={{ width: "1.125rem", height: "1.125rem" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-emerald-900 leading-snug">
          Add FollowUp to your Home Screen
        </p>
        <p className="text-xs text-emerald-800/70 mt-0.5 leading-relaxed">
          Tap the{" "}
          <span className="inline-flex items-baseline gap-0.5">
            <Share className="h-3 w-3 relative top-px text-emerald-700" />
            <span className="font-semibold text-emerald-800">Share</span>
          </span>{" "}
          button at the bottom of Safari, then tap{" "}
          <span className="font-semibold text-emerald-800">Add to Home Screen</span>.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-2 text-xs text-emerald-700/60 hover:text-emerald-800 transition-colors cursor-pointer touch-manipulation"
        >
          Maybe later
        </button>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 transition-colors cursor-pointer touch-manipulation"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
