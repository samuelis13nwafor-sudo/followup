import { Router } from "express";
import webpush from "web-push";
import type { PushSubscription } from "web-push";
import { createClient } from "@supabase/supabase-js";

const router = Router();

// In-memory dedup fallback (cleared each new day).
// Used when Supabase credentials are absent on the server.
const inMemoryReminded = new Set<string>();
let inMemoryDate = "";

function inMemoryCheck(today: string, userId: string, leadId: string): boolean {
  if (today !== inMemoryDate) { inMemoryReminded.clear(); inMemoryDate = today; }
  return inMemoryReminded.has(`${today}:${userId}:${leadId}`);
}

function inMemoryMark(today: string, userId: string, leadId: string): void {
  if (today !== inMemoryDate) { inMemoryReminded.clear(); inMemoryDate = today; }
  inMemoryReminded.add(`${today}:${userId}:${leadId}`);
}

interface LeadInput {
  id: string;
  name: string;
  followUpDate: string;
  status: string;
  isDemo?: boolean;
}

interface ReminderResult {
  checked: number;
  sent: number;
  skippedAlreadySent: number;
  skippedWonLost: number;
  skippedDemo: number;
  dueToday: number;
  overdue: number;
  errors: Array<{ leadName: string; reason: string }>;
  dueTodayNames: string[];
  overdueNames: string[];
  dedup: "supabase" | "in-memory";
}

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:hello@usefollowup.ca";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const CLOSED_STATUSES = new Set(["Won", "Lost"]);

router.post("/reminders/run", async (req, res) => {
  const isDev = process.env.NODE_ENV !== "production";

  if (!vapidPublicKey || !vapidPrivateKey) {
    res.status(503).json({ error: "VAPID keys not configured.", code: "vapid-missing" });
    return;
  }

  const { leads, subscription, today, userId } = req.body as {
    leads?: LeadInput[];
    subscription?: PushSubscription | null;
    today?: string;
    userId?: string | null;
  };

  if (!Array.isArray(leads) || !today || !userId) {
    res.status(400).json({
      error: "Missing required fields: leads (array), today (YYYY-MM-DD), userId.",
      code: "bad-request",
    });
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
        : "Invalid push subscription key. Please re-enable notifications.",
      code: "invalid-p256dh",
    });
    return;
  }

  // Build Supabase client using the user's JWT so RLS applies
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const authHeader = req.headers.authorization;
  const jwt = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const useSupabase = Boolean(supabaseUrl && supabaseKey && jwt);

  let sbClient: ReturnType<typeof createClient> | null = null;
  if (useSupabase && supabaseUrl && supabaseKey && jwt) {
    sbClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
  }

  // Load already-sent reminder IDs for today
  const alreadySentIds = new Set<string>();
  let dedup: "supabase" | "in-memory" = "in-memory";

  if (sbClient) {
    try {
      const { data, error } = await sbClient
        .from("reminder_log")
        .select("lead_id")
        .eq("user_id", userId)
        .eq("reminded_date", today);
      if (error) {
        req.log.warn({ err: error }, "reminder_log read failed; using in-memory dedup");
      } else {
        for (const row of (data ?? []) as Array<{ lead_id: string }>) {
          alreadySentIds.add(row.lead_id);
        }
        dedup = "supabase";
      }
    } catch (err) {
      req.log.warn({ err }, "reminder_log read threw; using in-memory dedup");
    }
  }

  const result: ReminderResult = {
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
  const dueTodayLeads: LeadInput[] = [];
  const overdueLeads: LeadInput[] = [];
  for (const lead of leads) {
    if (CLOSED_STATUSES.has(lead.status)) { result.skippedWonLost++; continue; }
    if (lead.isDemo) { result.skippedDemo++; continue; }
    if (lead.followUpDate > today) continue; // future — silent skip (not yet due)
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
  const toRemind: LeadInput[] = [];
  for (const lead of eligibleLeads) {
    const already = dedup === "supabase"
      ? alreadySentIds.has(lead.id)
      : inMemoryCheck(today, userId, lead.id);
    if (already) {
      result.skippedAlreadySent++;
    } else {
      toRemind.push(lead);
    }
  }

  if (toRemind.length === 0) {
    req.log.info({ result }, "Reminder check: nothing to send");
    res.json({ ok: true, result });
    return;
  }

  // Build push payload — use "due or overdue" copy when any overdue leads are included
  const toRemindHasOverdue = toRemind.some((l) => l.followUpDate < today);
  let title: string;
  let body: string;
  let url: string;

  if (toRemind.length === 1) {
    title = "FollowUp reminder";
    body = toRemindHasOverdue
      ? `${toRemind[0].name} is overdue for follow-up.`
      : `${toRemind[0].name} is due for follow-up today.`;
    url = `/leads/${toRemind[0].id}`;
  } else {
    title = "FollowUp reminders";
    body = toRemindHasOverdue
      ? `You have ${toRemind.length} follow-ups due or overdue.`
      : `You have ${toRemind.length} follow-ups due today.`;
    url = "/dashboard";
  }

  const payload = JSON.stringify({ title, body, url });

  // Send push
  try {
    await webpush.sendNotification(subscription, payload);
    result.sent = toRemind.length;
    req.log.info({ sent: result.sent, leads: toRemind.map((l) => l.name) }, "Reminders sent");

    // Persist to reminder_log so we don't re-send today
    const sentIds = toRemind.map((l) => l.id);
    if (dedup === "supabase" && sbClient) {
      try {
        // Double-cast: reminder_log is not in the Supabase generated schema, so TS infers never[]
        await sbClient.from("reminder_log").upsert(
          sentIds.map((leadId) => ({ user_id: userId, lead_id: leadId, reminded_date: today })) as unknown as never[],
          { onConflict: "user_id,lead_id,reminded_date" }
        );
      } catch (err) {
        req.log.warn({ err }, "reminder_log write failed (notification was still sent)");
      }
    } else {
      for (const id of sentIds) {
        inMemoryMark(today, userId, id);
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    req.log.error({ err }, "Failed to send reminder push notification");
    result.errors.push({
      leadName: toRemind.map((l) => l.name).join(", "),
      reason: isDev ? errMsg : "Push delivery failed.",
    });
  }

  res.json({ ok: true, result });
});

export default router;
