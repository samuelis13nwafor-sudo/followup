import { Router } from "express";
import webpush from "web-push";
import type { PushSubscription } from "web-push";

const router: Router = Router();

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:hello@usefollowup.ca";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

router.get("/push/vapid-public-key", (_req, res) => {
  if (!vapidPublicKey) {
    res.status(503).json({ error: "Push notifications not configured on this server." });
    return;
  }
  res.json({ publicKey: vapidPublicKey });
});

// /api/push/test — same handler, matches the Vercel function name
router.post("/push/test", async (req, res) => {
  const isDev = process.env.NODE_ENV !== "production";

  if (!vapidPublicKey || !vapidPrivateKey) {
    res.status(503).json({ error: "VAPID keys not configured.", code: "vapid-missing" });
    return;
  }

  const { subscription } = req.body as { subscription?: PushSubscription };

  if (
    !subscription?.endpoint ||
    typeof subscription?.keys?.p256dh !== "string" ||
    typeof subscription?.keys?.auth !== "string"
  ) {
    res.status(400).json({ error: "Invalid or missing push subscription.", code: "bad-subscription" });
    return;
  }

  // Decode and validate key lengths before web-push does — gives a clearer error
  const p256dhBytes = Buffer.from(subscription.keys.p256dh, "base64");
  const authBytes = Buffer.from(subscription.keys.auth, "base64");

  req.log.info({
    endpoint: subscription.endpoint.slice(0, 60),
    p256dhDecodedBytes: p256dhBytes.length,
    p256dhRawChars: subscription.keys.p256dh.length,
    authDecodedBytes: authBytes.length,
  }, "Push test: subscription key details");

  if (p256dhBytes.length !== 65) {
    const detail =
      `p256dh decodes to ${p256dhBytes.length} bytes (expected 65). ` +
      `Raw string is ${subscription.keys.p256dh.length} chars. ` +
      `This usually means the push subscription was created in a sandboxed or dev-mode context ` +
      `that does not produce standard browser push keys. ` +
      `Click "Re-enable" below to unsubscribe and create a fresh subscription.`;
    req.log.error({ p256dhBytes: p256dhBytes.length }, "Invalid p256dh key length");
    res.status(400).json({
      error: isDev ? detail : "Invalid subscription key. Please re-enable notifications.",
      code: "invalid-p256dh",
    });
    return;
  }

  const payload = JSON.stringify({
    title: "FollowUp reminder",
    body: "Test notification from FollowUp.",
    url: "/dashboard",
  });

  try {
    await webpush.sendNotification(subscription, payload);
    res.json({ ok: true });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    req.log.error({ err }, "Failed to send test push notification");
    res.status(500).json({
      error: isDev ? errMsg : "Failed to deliver push notification.",
      code: "send-failed",
    });
  }
});

// /api/push/subscribe — validate a push subscription (Supabase save is done client-side)
router.post("/push/subscribe", (req, res) => {
  const { subscription } = req.body as { subscription?: PushSubscription };
  if (
    !subscription?.endpoint ||
    !subscription?.keys?.p256dh ||
    !subscription?.keys?.auth
  ) {
    res.status(400).json({ error: "Invalid push subscription." });
    return;
  }
  res.json({ ok: true });
});

// /api/push/send-test — legacy alias kept for compatibility
router.post("/push/send-test", async (req, res) => {
  if (!vapidPublicKey || !vapidPrivateKey) {
    res.status(503).json({ error: "VAPID keys not configured." });
    return;
  }

  const { subscription } = req.body as { subscription?: PushSubscription };

  if (
    !subscription?.endpoint ||
    !subscription?.keys?.p256dh ||
    !subscription?.keys?.auth
  ) {
    res.status(400).json({ error: "Invalid or missing push subscription." });
    return;
  }

  const payload = JSON.stringify({
    title: "FollowUp reminder",
    body: "Test notification from FollowUp.",
    url: "/dashboard",
  });

  try {
    await webpush.sendNotification(subscription, payload);
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to send test push notification");
    res.status(500).json({ error: "Failed to deliver push notification." });
  }
});

export default router;
