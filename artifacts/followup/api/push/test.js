import webpush from "web-push";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const isDev = process.env.NODE_ENV !== "production";
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject =
    process.env.VAPID_SUBJECT ?? "mailto:hello@usefollowup.ca";

  if (!vapidPublicKey || !vapidPrivateKey) {
    res.status(503).json({ error: "VAPID keys not configured.", code: "vapid-missing" });
    return;
  }

  const body = req.body ?? {};
  const { subscription } = body;

  if (
    !subscription?.endpoint ||
    typeof subscription?.keys?.p256dh !== "string" ||
    typeof subscription?.keys?.auth !== "string"
  ) {
    res.status(400).json({ error: "Invalid or missing push subscription.", code: "bad-subscription" });
    return;
  }

  // Decode and validate key lengths before web-push does
  const p256dhBytes = Buffer.from(subscription.keys.p256dh, "base64");
  const authBytes = Buffer.from(subscription.keys.auth, "base64");

  if (p256dhBytes.length !== 65) {
    const detail =
      `p256dh decodes to ${p256dhBytes.length} bytes (expected 65). ` +
      `Raw string is ${subscription.keys.p256dh.length} chars. ` +
      `This usually means the subscription was created in a sandboxed environment. ` +
      `Click "Re-enable" to unsubscribe and create a fresh subscription.`;
    res.status(400).json({
      error: isDev ? detail : "Invalid subscription key. Please re-enable notifications.",
      code: "invalid-p256dh",
    });
    return;
  }

  if (authBytes.length !== 16) {
    res.status(400).json({
      error: isDev
        ? `auth key decodes to ${authBytes.length} bytes (expected 16).`
        : "Invalid subscription auth key.",
      code: "invalid-auth",
    });
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
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Failed to send test push notification:", errMsg);
    res.status(500).json({
      error: isDev ? errMsg : "Failed to deliver push notification.",
      code: "send-failed",
    });
  }
}
