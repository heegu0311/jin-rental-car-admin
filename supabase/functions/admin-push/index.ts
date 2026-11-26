// Sends admin web push. Called only by DB (pg_net) with the Vault shared secret.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

interface Payload {
  title: string;
  body: string;
  url: string;
  tag: string;
  user_id: string | null;
}
interface Context {
  secret: string | null;
  public_key: string | null;
  private_key: string | null;
  subject: string | null;
  subscriptions: { endpoint: string; p256dh: string; auth: string }[];
}

const UUID = /^[0-9a-f-]{36}$/i;
function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function parse(input: unknown): Payload | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const title = text(raw.title, 80),
    url = text(raw.url, 200),
    userId = text(raw.user_id, 36);
  // Only same-origin admin paths may be opened from a notification.
  if (!title || !/^\/(?!\/)[\w\-/]*$/.test(url)) return null;
  if (userId && !UUID.test(userId)) return null;
  return {
    title,
    body: text(raw.body, 160),
    url,
    tag: text(raw.tag, 80) || "jin-admin",
    user_id: userId || null,
  };
}
function sameSecret(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function context(db: SupabaseClient, userId: string | null) {
  const { data, error } = await db.rpc("admin_push_dispatch_context", {
    p_user_id: userId,
  });
  return error ? null : (data as Context);
}
// VAPID keys are created here once and kept only in Vault.
async function ensureKeys(db: SupabaseClient) {
  const { publicKey, privateKey } = webpush.generateVAPIDKeys();
  const { error } = await db.rpc("admin_push_store_vapid", {
    p_public: publicKey,
    p_private: privateKey,
  });
  return !error;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response(null, { status: 405 });
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    raw = null;
  }
  const payload = parse(raw);
  let ctx = await context(db, payload?.user_id ?? null);
  if (!ctx) return new Response(null, { status: 500 });
  // Idempotent bootstrap: creates keys only if none exist, returns nothing secret.
  if (!ctx.public_key || !ctx.private_key) {
    if (!(await ensureKeys(db))) return new Response(null, { status: 500 });
    ctx = await context(db, payload?.user_id ?? null);
    if (!ctx) return new Response(null, { status: 500 });
  }
  if ((raw as { provision?: unknown } | null)?.provision === true)
    return Response.json({ ready: !!ctx.public_key });
  const given = req.headers.get("x-push-secret") ?? "";
  if (!ctx.secret || !sameSecret(given, ctx.secret))
    return new Response(null, { status: 401 });
  if (!payload) return new Response(null, { status: 400 });
  if (!ctx.public_key || !ctx.private_key || !ctx.subject)
    return new Response(null, { status: 503 });

  webpush.setVapidDetails(ctx.subject, ctx.public_key, ctx.private_key);
  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    tag: payload.tag,
  });
  const expired: string[] = [];
  const results = await Promise.allSettled(
    ctx.subscriptions.map((s) =>
      webpush
        .sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          message,
          { TTL: 60 * 60 * 24, urgency: "high" },
        )
        .catch((err: { statusCode?: number }) => {
          if (err.statusCode === 404 || err.statusCode === 410)
            expired.push(s.endpoint);
          throw err;
        }),
    ),
  );
  if (expired.length)
    await db.from("admin_push_subscriptions").delete().in("endpoint", expired);
  const sent = results.filter((r) => r.status === "fulfilled").length;
  return Response.json({
    sent,
    failed: results.length - sent,
    removed: expired.length,
  });
});
