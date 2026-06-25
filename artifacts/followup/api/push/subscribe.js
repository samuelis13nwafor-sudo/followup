export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const body = req.body ?? {};
  const { subscription } = body;

  if (
    !subscription?.endpoint ||
    !subscription?.keys?.p256dh ||
    !subscription?.keys?.auth
  ) {
    res.status(400).json({ error: "Invalid push subscription." });
    return;
  }

  res.json({ ok: true });
}
