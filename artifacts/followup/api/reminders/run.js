import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const CLOSED_STATUSES = new Set(["Won", "Lost"]);

const inMemoryReminded = new Set();
let inMemoryDate = "";

function inMemoryCheck(today, userId, leadId) {
  if (today !== inMemoryDate) { inMemoryReminded.clear(); inMemoryDate = today; }
  return inMemoryReminded.has(`${today}:${userId}:${leadId}`);
}
function inMemoryMark(today, userId, leadId) {
  if (today !== inMemoryDate) { inMemoryReminded.clear(); inMemoryDate = today; }
  inMemoryReminded.add(`${today}:${userId}:${leadId}`);
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const isDev = process.env.NODE_ENV !== "production";
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:hello@usefollowup.ca";

  if (!vapidPublicKey || !vapidPrivateKey) {
    res.status(503).json({ error: "VAPID keys not configured.", code: "vapid-missing" });
    return;
  }

  const body = req.body ?? {};
  const { leads, subscription, today, userId } = body;

  if (!Array.isArray(leads) || !today || !userId) {
    res.status(400).json({ error: "Missing required fields: leads, today, userId.", code: "bad-request" });
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    res.status(400).json({ error: "today must be YYYY-MM-DD.", code: "bad-date" });
    return;
  }
  if (!subscription?.endpoint || typeof subscription?.keys?.p256dh !== "string") {
    res.status(400).json({
      error: "No valid push subscription provided. Enable push notifications first.",
      code: "no-subscription",
    });
    return;
  }

  const p256dhBytes = Buffer.from(subscription.keys.p256dh, "base64");
  if (p256dhBytes.length !== 65) {
    res.status(400).json({
      error: isDev
        ? `p256dh decodes to ${p256dhBytes.length} bytes (expected 65). Re-enable push notifications.`
        : "Invalid push subscription key.",
      code: "invalid-p256dh",
    });
    return;
  }

  // Supabase client using user's JWT (RLS applies)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const authHeader = req.headers.authorization;
  const jwt = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const useSupabase = Boolean(supabaseUrl && supabaseKey && jwt);

  let sbClient = null;
  if (useSupabase) {
    sbClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
  }

  const alreadySentIds = new Set();
  let dedup = "in-memory";

  if (sbClient) {
    try {
      const { data, error } = await sbClient
        .from("reminder_log")
        .select("lead_id")
        .eq("user_id", userId)
        .eq("reminded_date", today);
      if (!error && data) {
        for (const row of data) alreadySentIds.add(row.lead_id);
        dedup = "supabase";
      }
    } catch { /* fall through to in-memory */ }
  }

  const result = {
    checked: leads.length,
    sent: 0,
    skippedAlreadySent: 0,
    skippedWonLost: 0,
    skippedDemo: 0,
    dueToday: 0,
    overdue: 0,
    errors: [],
    dueTodayNames: [],
    overdueNames: [],
    dedup,
  };

  // Filter: same logic as dashboard — skip Won/Lost, demo leads, and future dates.
  // Separate "due today" (exact match) from "overdue" (strictly before today).
  const dueTodayLeads = [];
  const overdueLeads = [];
  for (const lead of leads) {
    if (CLOSED_STATUSES.has(lead.status)) { result.skippedWonLost++; continue; }
    if (lead.isDemo) { result.skippedDemo++; continue; }
    if (lead.followUpDate > today) continue; // future — silent skip
    if (lead.followUpDate === today) {
      dueTodayLeads.push(lead);
    } else {
      overdueLeads.push(lead); // followUpDate < today
    }
  }
  result.dueToday = dueTodayLeads.length;
  result.overdue = overdueLeads.length;
  result.dueTodayNames = dueTodayLeads.map((l) => l.name);
  result.overdueNames = overdueLeads.map((l) => l.name);

  // Eligible = overdue first (most urgent), then due today
  const eligibleLeads = [...overdueLeads, ...dueTodayLeads];

  // Dedup: skip leads already reminded today
  const toRemind = [];
  for (const lead of eligibleLeads) {
    const already = dedup === "supabase"
      ? alreadySentIds.has(lead.id)
      : inMemoryCheck(today, userId, lead.id);
    if (already) { result.skippedAlreadySent++; } else { toRemind.push(lead); }
  }

  if (toRemind.length === 0) {
    res.json({ ok: true, result });
    return;
  }

  // Build push payload — use "due or overdue" copy when any overdue leads are included
  const toRemindHasOverdue = toRemind.some((l) => l.followUpDate < today);
  let title, bodyText, url;
  if (toRemind.length === 1) {
    title = "FollowUp reminder";
    bodyText = toRemindHasOverdue
      ? `${toRemind[0].name} is overdue for follow-up.`
      : `${toRemind[0].name} is due for follow-up today.`;
    url = `/leads/${toRemind[0].id}`;
  } else {
    title = "FollowUp reminders";
    bodyText = toRemindHasOverdue
      ? `You have ${toRemind.length} follow-ups due or overdue.`
      : `You have ${toRemind.length} follow-ups due today.`;
    url = "/dashboard";
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  const payload = JSON.stringify({ title, body: bodyText, url });

  try {
    await webpush.sendNotification(subscription, payload);
    result.sent = toRemind.length;

    const sentIds = toRemind.map((l) => l.id);
    if (dedup === "supabase" && sbClient) {
      try {
        await sbClient.from("reminder_log").upsert(
          sentIds.map((leadId) => ({ user_id: userId, lead_id: leadId, reminded_date: today })),
          { onConflict: "user_id,lead_id,reminded_date" }
        );
      } catch { /* non-fatal */ }
    } else {
      for (const id of sentIds) inMemoryMark(today, userId, id);
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Reminder push failed:", errMsg);
    result.errors.push({
      leadName: toRemind.map((l) => l.name).join(", "),
      reason: isDev ? errMsg : "Push delivery failed.",
    });
  }

  res.json({ ok: true, result });
}
