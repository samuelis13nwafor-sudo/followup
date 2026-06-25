import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

const VAPID_KEY_URL = "/api/push/vapid-public-key";
const SUBSCRIBE_URL = "/api/push/subscribe";
const SEND_TEST_URL = "/api/push/test";
const DISMISSED_KEY = "followup_push_dismissed_until";
const ENABLED_KEY = "followup_push_enabled";
const IS_DEV = import.meta.env.DEV;

function devLog(...args: unknown[]): void {
  if (IS_DEV) console.log("[Push]", ...args);
}

/**
 * Fetch wrapper that detects HTML responses (Vercel 404 / SPA fallback)
 * and throws a clear, user-facing error instead of a cryptic JSON parse failure.
 */
async function safeJsonFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    devLog(`safeJsonFetch: ${url} returned non-JSON (${contentType})`);
    throw Object.assign(new Error("not-json"), {
      userMessage: "Push notifications are not configured yet.",
    });
  }
  return res;
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
  const [sendError, setSendError] = useState<string | null>(null);
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
      const ct = res.headers.get("content-type") ?? "";
      if (res.ok && ct.includes("application/json")) {
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
      devLog(
        "Push not supported (missing serviceWorker, PushManager, or Notification API)"
      );
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
      if (
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        throw Object.assign(new Error("unsupported"), {
          userMessage: "Push notifications are not supported in this browser.",
        });
      }
      devLog(
        "Step 1: Notification API present, permission:",
        Notification.permission
      );

      // Step 2 — fetch VAPID public key (safe: detects HTML response)
      devLog("Step 2: Fetching VAPID public key from server…");
      const vapidRes = await safeJsonFetch(VAPID_KEY_URL);
      if (!vapidRes.ok) {
        throw Object.assign(new Error("vapid-missing"), {
          userMessage: "Push notifications are not configured yet.",
        });
      }
      const { publicKey } = (await vapidRes.json()) as {
        publicKey?: string;
      };
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
          userMessage:
            "Service worker took too long. Try reloading the page.",
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

      // Step 6 — register subscription server-side (non-fatal)
      devLog("Step 6: Registering subscription with server…");
      try {
        const subRes = await safeJsonFetch(SUBSCRIBE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        });
        if (!subRes.ok) {
          devLog("Step 6: Server registration returned non-OK (non-fatal)");
        } else {
          devLog("Step 6: Server registration OK");
        }
      } catch (err) {
        devLog("Step 6: Server registration failed (non-fatal):", err);
      }

      // Step 7 — persist to Supabase
      devLog("Step 7: Saving subscription to Supabase…");
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
          devLog("Step 7: Supabase save failed (non-fatal):", error.message);
        } else {
          devLog("Step 7: Subscription saved to Supabase");
        }
      } else {
        devLog(
          "Step 7: Skipped — Supabase not configured or user not signed in"
        );
      }
    } catch (err) {
      const userMessage =
        (err as { userMessage?: string }).userMessage ??
        (err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.");
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

  /** Unsubscribe from push, clear stored state, and return to the idle card. */
  const resetSubscription = useCallback(async (): Promise<void> => {
    devLog("resetSubscription: unsubscribing…");
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
    } catch (err) {
      devLog("resetSubscription: unsubscribe failed (non-fatal):", err);
    }
    localStorage.removeItem(ENABLED_KEY);
    localStorage.removeItem(DISMISSED_KEY);
    setSubscription(null);
    setSendResult(null);
    setSendError(null);
    setEnableStatus("idle");
    setEnableError(null);
    setPushState("idle");
    devLog("resetSubscription: done, state reset to idle");
    void refreshDiag();
  }, [refreshDiag]);

  const sendTest = useCallback(async (): Promise<void> => {
    if (!subscription) return;
    setIsSending(true);
    setSendResult(null);
    setSendError(null);
    try {
      const res = await safeJsonFetch(SEND_TEST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      if (res.ok) {
        setSendResult("ok");
        devLog("sendTest: success");
      } else {
        const data = (await res.json()) as { error?: string; code?: string };
        const msg = data.error ?? "Failed to deliver push notification.";
        devLog("sendTest: server error:", data);
        setSendResult("error");
        setSendError(msg);
      }
    } catch (err) {
      const msg =
        (err as { userMessage?: string }).userMessage ??
        (err instanceof Error ? err.message : "Send failed.");
      devLog("sendTest: fetch failed:", err);
      setSendResult("error");
      setSendError(msg);
    } finally {
      setIsSending(false);
    }
  }, [subscription]);

  return {
    pushState,
    subscription,
    enable,
    dismiss,
    resetSubscription,
    sendTest,
    isSending,
    sendResult,
    sendError,
    enableStatus,
    enableError,
    diagInfo,
    refreshDiag,
  };
}
