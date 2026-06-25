import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

const VAPID_KEY_URL = "/api/push/vapid-public-key";
const SEND_TEST_URL = "/api/push/send-test";
const DISMISSED_KEY = "followup_push_dismissed_until";
const ENABLED_KEY = "followup_push_enabled";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function isIOS(): boolean {
  return /iP(hone|ad|od)/.test(navigator.userAgent);
}

export function isIOSStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export type PushState =
  | "unsupported"        // browser doesn't support push
  | "ios-not-installed"  // on iOS but not opened from home screen
  | "blocked"            // user denied permission
  | "subscribed"         // push enabled and subscribed
  | "dismissed"          // user snoozed the prompt
  | "idle";              // supported, not yet asked

export function usePushNotifications(userId: string | null | undefined) {
  const [pushState, setPushState] = useState<PushState>("idle");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<"ok" | "error" | null>(null);

  useEffect(() => {
    if (!isPushSupported()) {
      setPushState("unsupported");
      return;
    }
    if (isIOS() && !isIOSStandalone()) {
      setPushState("ios-not-installed");
      return;
    }
    if (Notification.permission === "denied") {
      setPushState("blocked");
      return;
    }

    // Check snooze
    const hiddenUntil = localStorage.getItem(DISMISSED_KEY);
    if (hiddenUntil && Date.now() < Number(hiddenUntil)) {
      setPushState("dismissed");
      return;
    }

    // Check if already subscribed in this browser
    void navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setSubscription(existing);
        setPushState("subscribed");
      } else if (localStorage.getItem(ENABLED_KEY)) {
        // Was enabled in a prior session but subscription was lost (browser cleared it)
        localStorage.removeItem(ENABLED_KEY);
      }
    }).catch(() => {});
  }, []);

  const enable = useCallback(async (): Promise<void> => {
    if (!isPushSupported()) return;

    try {
      const res = await fetch(VAPID_KEY_URL);
      if (!res.ok) throw new Error("Push not configured");
      const { publicKey } = (await res.json()) as { publicKey: string };

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushState("blocked");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      setSubscription(sub);
      setPushState("subscribed");
      localStorage.setItem(ENABLED_KEY, "1");

      // Persist to Supabase if configured
      if (supabaseConfigured && userId) {
        const subJson = sub.toJSON();
        await supabase.from("push_subscriptions").upsert(
          {
            user_id: userId,
            endpoint: subJson.endpoint,
            p256dh_key: subJson.keys?.p256dh,
            auth_key: subJson.keys?.auth,
          },
          { onConflict: "user_id,endpoint" }
        );
      }
    } catch {
      // Silently ignore — subscription may have failed if VAPID not configured yet
    }
  }, [userId]);

  const dismiss = useCallback(() => {
    const until = Date.now() + 14 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, String(until));
    setPushState("dismissed");
  }, []);

  const sendTest = useCallback(async (): Promise<void> => {
    if (!subscription) return;
    setIsSending(true);
    setSendResult(null);
    try {
      const res = await fetch(SEND_TEST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      setSendResult(res.ok ? "ok" : "error");
    } catch {
      setSendResult("error");
    } finally {
      setIsSending(false);
    }
  }, [subscription]);

  return { pushState, subscription, enable, dismiss, sendTest, isSending, sendResult };
}
