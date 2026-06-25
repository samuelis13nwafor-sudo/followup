import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

const VAPID_KEY_URL = "/api/push/vapid-public-key";
const SEND_TEST_URL = "/api/push/send-test";
const DISMISSED_KEY = "followup_push_dismissed_until";
const ENABLED_KEY = "followup_push_enabled";
const IS_DEV = import.meta.env.DEV;

function devLog(...args: unknown[]): void {
  if (IS_DEV) console.log("[Push]", ...args);
}

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

async function waitForSWReady(
  timeoutMs = 10_000
): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            Object.assign(new Error("sw-timeout"), {
              userMessage:
                "Service worker took too long. Try reloading the page.",
            })
          ),
        timeoutMs
      )
    ),
  ]);
}

export type PushState =
  | "unsupported"
  | "ios-not-installed"
  | "blocked"
  | "subscribed"
  | "dismissed"
  | "idle";

export type EnableStatus = "idle" | "loading" | "success" | "error";

export interface DiagInfo {
  notificationPermission: NotificationPermission | "unsupported";
  swSupported: boolean;
  swRegistered: boolean | null;
  subscriptionActive: boolean | null;
  vapidKeyPresent: boolean | null;
}

const INITIAL_DIAG: DiagInfo = {
  notificationPermission: "default",
  swSupported: false,
  swRegistered: null,
  subscriptionActive: null,
  vapidKeyPresent: null,
};

export function usePushNotifications(userId: string | null | undefined) {
  const [pushState, setPushState] = useState<PushState>("idle");
  const [subscription, setSubscription] =
    useState<PushSubscription | null>(null);
  const [enableStatus, setEnableStatus] = useState<EnableStatus>("idle");
  const [enableError, setEnableError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<"ok" | "error" | null>(null);
  const [diagInfo, setDiagInfo] = useState<DiagInfo>(INITIAL_DIAG);

  const refreshDiag = useCallback(async (): Promise<void> => {
    const swSupported = "serviceWorker" in navigator;
    const notificationPermission: NotificationPermission | "unsupported" =
      "Notification" in window ? Notification.permission : "unsupported";

    let swRegistered: boolean | null = null;
    let subscriptionActive: boolean | null = null;

    if (swSupported) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        swRegistered = regs.length > 0;
        if (swRegistered && regs[0]) {
          const sub = await regs[0].pushManager.getSubscription();
          subscriptionActive = sub !== null;
        }
      } catch {
        swRegistered = false;
      }
    }

    let vapidKeyPresent: boolean | null = null;
    try {
      const res = await fetch(VAPID_KEY_URL);
      if (res.ok) {
        const data = (await res.json()) as { publicKey?: string };
        vapidKeyPresent = Boolean(data.publicKey);
      } else {
        vapidKeyPresent = false;
      }
    } catch {
      vapidKeyPresent = false;
    }

    setDiagInfo({
      notificationPermission,
      swSupported,
      swRegistered,
      subscriptionActive,
      vapidKeyPresent,
    });
  }, []);

  useEffect(() => {
    devLog("Initialising push state check…");

    if (!isPushSupported()) {
      devLog("Push not supported (missing serviceWorker, PushManager, or Notification API)");
      setPushState("unsupported");
      void refreshDiag();
      return;
    }

    if (isIOS() && !isIOSStandalone()) {
      devLog("iOS detected but app is not installed to home screen");
      setPushState("ios-not-installed");
      void refreshDiag();
      return;
    }

    if (Notification.permission === "denied") {
      devLog("Notification permission is denied by browser");
      setPushState("blocked");
      void refreshDiag();
      return;
    }

    const hiddenUntil = localStorage.getItem(DISMISSED_KEY);
    if (hiddenUntil && Date.now() < Number(hiddenUntil)) {
      devLog(
        "Push card snoozed until",
        new Date(Number(hiddenUntil)).toLocaleString()
      );
      setPushState("dismissed");
      void refreshDiag();
      return;
    }

    void (async () => {
      try {
        devLog("Waiting for service worker to be ready (5 s timeout)…");
        const reg = await waitForSWReady(5_000);
        devLog("Service worker ready, scope:", reg.scope);
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          devLog("Existing push subscription found:", existing.endpoint);
          setSubscription(existing);
          setPushState("subscribed");
        } else {
          devLog("No existing push subscription");
          if (localStorage.getItem(ENABLED_KEY)) {
            localStorage.removeItem(ENABLED_KEY);
          }
        }
      } catch (err) {
        devLog("SW ready check failed during init:", err);
      }
      void refreshDiag();
    })();
  }, [refreshDiag]);

  const enable = useCallback(async (): Promise<void> => {
    setEnableStatus("loading");
    setEnableError(null);

    try {
      // Step 1 — check browser support
      devLog("Step 1: Checking Notification API support…");
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw Object.assign(new Error("unsupported"), {
          userMessage: "Push notifications are not supported in this browser.",
        });
      }
      devLog("Step 1: Notification API present, permission:", Notification.permission);

      // Step 2 — fetch VAPID public key
      devLog("Step 2: Fetching VAPID public key from server…");
      const res = await fetch(VAPID_KEY_URL);
      if (!res.ok) {
        throw Object.assign(new Error("vapid-missing"), {
          userMessage: "Push notifications are not configured yet.",
        });
      }
      const { publicKey } = (await res.json()) as { publicKey?: string };
      if (!publicKey) {
        throw Object.assign(new Error("vapid-empty"), {
          userMessage: "Push notifications are not configured yet.",
        });
      }
      devLog("Step 2: VAPID key received");

      // Step 3 — confirm service worker is registered and active
      devLog("Step 3: Waiting for service worker to be ready…");
      let reg: ServiceWorkerRegistration;
      try {
        reg = await waitForSWReady(10_000);
      } catch {
        throw Object.assign(new Error("sw-timeout"), {
          userMessage: "Service worker took too long. Try reloading the page.",
        });
      }
      devLog("Step 3: Service worker active, scope:", reg.scope);

      // Step 4 — request notification permission
      devLog("Step 4: Requesting notification permission from user…");
      const permission = await Notification.requestPermission();
      devLog("Step 4: Permission result:", permission);
      if (permission !== "granted") {
        setPushState("blocked");
        setEnableStatus("error");
        setEnableError(
          "Notifications are blocked. Enable them in your browser settings."
        );
        void refreshDiag();
        return;
      }

      // Step 5 — subscribe with PushManager
      devLog("Step 5: Subscribing with PushManager using VAPID key…");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      devLog("Step 5: Subscribed successfully, endpoint:", sub.endpoint);

      setSubscription(sub);
      setPushState("subscribed");
      setEnableStatus("success");
      localStorage.setItem(ENABLED_KEY, "1");

      // Step 6 — persist to Supabase
      devLog("Step 6: Saving subscription to Supabase…");
      if (supabaseConfigured && userId) {
        const subJson = sub.toJSON();
        const { error } = await supabase.from("push_subscriptions").upsert(
          {
            user_id: userId,
            endpoint: subJson.endpoint,
            p256dh_key: subJson.keys?.p256dh,
            auth_key: subJson.keys?.auth,
          },
          { onConflict: "user_id,endpoint" }
        );
        if (error) {
          devLog("Step 6: Supabase save failed (non-fatal):", error.message);
        } else {
          devLog("Step 6: Subscription saved to Supabase");
        }
      } else {
        devLog("Step 6: Skipped — Supabase not configured or user not signed in");
      }
    } catch (err) {
      const userMessage =
        (err as { userMessage?: string }).userMessage ??
        (err instanceof Error ? err.message : "Something went wrong. Please try again.");
      devLog("enable() failed:", err);
      setEnableStatus("error");
      setEnableError(userMessage);
    }

    void refreshDiag();
  }, [userId, refreshDiag]);

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

  return {
    pushState,
    subscription,
    enable,
    dismiss,
    sendTest,
    isSending,
    sendResult,
    enableStatus,
    enableError,
    diagInfo,
    refreshDiag,
  };
}
