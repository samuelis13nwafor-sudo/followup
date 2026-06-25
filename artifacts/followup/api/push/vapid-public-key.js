export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    res.status(503).json({ error: "Push notifications are not configured yet." });
    return;
  }

  res.json({ publicKey });
}
