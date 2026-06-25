import webpush from "web-push";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject =
    process.env.VAPID_SUBJECT ?? "mailto:hello@usefollowup.ca";

  if (!vapidPublicKey || !vapidPrivateKey) {
    res.status(503).json({ error: "VAPID keys not configured." });
    return;
  }

  const body = req.body ?? {};
  const { subscription } = body;

  if (
    !subscription?.endpoint ||
    !subscription?.keys?.p256dh ||
    !subscription?.keys?.auth
  ) {
    res.status(400).json({ error: "Invalid or missing push subscription." });
    return;
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const payload = JSON.stringify({
    title: "FollowUp reminder",
    body: "Test notification from FollowUp.",
    url: "/dashboard",
  });

  try {
    await webpush.sendNotification(subscription, payload);
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to send test push notification:", err);
    res.status(500).json({ error: "Failed to deliver push notification." });
  }
}
