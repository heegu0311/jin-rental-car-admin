/** Browser PushSubscription JSON accepted from an admin device. */
export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}
const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;
export function validPushEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 1000) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
export function pushSubscriptionInput(
  value: unknown,
): PushSubscriptionInput | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { endpoint?: unknown; keys?: unknown };
  const keys = (raw.keys ?? {}) as { p256dh?: unknown; auth?: unknown };
  const { p256dh, auth } = keys;
  if (
    !validPushEndpoint(raw.endpoint) ||
    typeof p256dh !== "string" ||
    typeof auth !== "string" ||
    p256dh.length > 200 ||
    auth.length > 100 ||
    !BASE64URL.test(p256dh) ||
    !BASE64URL.test(auth)
  )
    return null;
  return { endpoint: raw.endpoint, p256dh, auth };
}
