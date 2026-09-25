"use server";
import { requireAdmin } from "@/lib/auth";
import { pushSubscriptionInput, validPushEndpoint } from "./subscription";

export interface PushResult {
  error?: string;
  publicKey?: string;
}
export async function pushPublicKey(): Promise<PushResult> {
  const { db } = await requireAdmin();
  const { data, error } = await db.rpc("admin_push_public_key");
  if (error || typeof data !== "string" || !data)
    return { error: "알림 서버 설정이 완료되지 않았습니다." };
  return { publicKey: data };
}
export async function registerPush(
  subscription: unknown,
  userAgent: unknown,
): Promise<PushResult> {
  const { db } = await requireAdmin();
  const input = pushSubscriptionInput(subscription);
  if (!input) return { error: "알림 구독 정보가 올바르지 않습니다." };
  const { error } = await db.rpc("register_admin_push_subscription", {
    p_endpoint: input.endpoint,
    p_p256dh: input.p256dh,
    p_auth: input.auth,
    p_user_agent:
      typeof userAgent === "string" ? userAgent.slice(0, 300) : null,
  });
  return error ? { error: "알림 등록에 실패했습니다. 다시 시도해주세요." } : {};
}
export async function removePush(endpoint: unknown): Promise<PushResult> {
  const { db } = await requireAdmin();
  if (!validPushEndpoint(endpoint))
    return { error: "알림 정보가 올바르지 않습니다." };
  const { error } = await db.rpc("remove_admin_push_subscription", {
    p_endpoint: endpoint,
  });
  return error ? { error: "알림 해제에 실패했습니다. 다시 시도해주세요." } : {};
}
export async function sendTestPush(): Promise<PushResult> {
  const { db } = await requireAdmin();
  const { error } = await db.rpc("send_admin_test_push");
  return error ? { error: "테스트 알림 요청에 실패했습니다." } : {};
}
