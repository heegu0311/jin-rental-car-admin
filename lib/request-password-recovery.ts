import type { SupabaseClient } from "@supabase/supabase-js";

export async function requestAdminPasswordRecovery(
  db: SupabaseClient,
  email: string,
  origin: string,
) {
  const { data: eligible, error: lookupError } = await db.rpc(
    "is_admin_recovery_email",
    { email_input: email.toLowerCase() },
  );
  if (lookupError || typeof eligible !== "boolean")
    return {
      error: "관리자 이메일을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  if (!eligible) return { error: "유효한 관리자 이메일이 아닙니다." };

  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/recovery`,
  });
  if (error)
    return {
      error:
        error.status === 429
          ? "요청이 많습니다. 잠시 후 다시 시도해 주세요."
          : "재설정 메일을 요청하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  return { success: true };
}
