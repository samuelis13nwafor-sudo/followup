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
