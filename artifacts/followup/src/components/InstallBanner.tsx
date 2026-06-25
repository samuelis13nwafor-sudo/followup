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

    let cleanup: (() => void) | undefined;

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
        cleanup = () => window.removeEventListener("beforeinstallprompt", onPrompt);
      }
    } else {
      // iOS — always show the instructions (Safari or Chrome message)
      setVisible(true);
    }

    return cleanup;
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

  // ── iOS Chrome (or any non-Safari iOS browser) ───────────────────────────
  if (platform === "ios-chrome") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 flex items-start gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-lg bg-slate-600 flex items-center justify-center shrink-0 mt-0.5">
          <Smartphone className="h-4.5 w-4.5 text-white" style={{ width: "1.125rem", height: "1.125rem" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-snug">
            Install FollowUp on your iPhone
          </p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Open{" "}
            <span className="font-semibold text-slate-700">usefollowup.ca</span>
            {" "}in <span className="font-semibold text-slate-700">Safari</span> to install
            FollowUp on your Home Screen.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="mt-2.5 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer touch-manipulation"
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
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 flex items-start gap-3 shadow-sm">
      <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
        <Share className="h-4.5 w-4.5 text-white" style={{ width: "1.125rem", height: "1.125rem" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-snug">
          Install FollowUp on your iPhone
        </p>
        <ol className="mt-2 space-y-1 text-xs text-slate-600 leading-relaxed list-none">
          <li><span className="font-semibold text-slate-500 mr-1.5">1.</span>Open this page in <span className="font-semibold text-slate-800">Safari</span>.</li>
          <li>
            <span className="font-semibold text-slate-500 mr-1.5">2.</span>Tap the{" "}
            <span className="inline-flex items-baseline gap-0.5">
              <Share className="h-3 w-3 relative top-px text-slate-600" />
            </span>{" "}
            <span className="font-semibold text-slate-800">Share</span> icon — the square with an arrow.
          </li>
          <li><span className="font-semibold text-slate-500 mr-1.5">3.</span>Tap <span className="font-semibold text-slate-800">Add to Home Screen</span>.</li>
          <li><span className="font-semibold text-slate-500 mr-1.5">4.</span>Tap <span className="font-semibold text-slate-800">Add</span>.</li>
        </ol>
        <button
          type="button"
          onClick={dismiss}
          className="mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer touch-manipulation"
        >
          Maybe later
        </button>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer touch-manipulation"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
