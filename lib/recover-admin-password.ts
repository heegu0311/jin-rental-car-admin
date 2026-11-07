import type { SupabaseClient } from "@supabase/supabase-js";

/** Session and role must be checked on every save, independently of the recovery page. */
export async function recoverAdminPassword(
  db: SupabaseClient,
  password: string,
  currentPassword?: string,
) {
  const {
    data: { user },
    error: sessionError,
  } = await db.auth.getUser();
  if (sessionError || !user)
    return {
      error: "재설정 인증이 만료되었습니다. 메일을 다시 요청해 주세요.",
    };
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (
    profileError ||
    !profile ||
    !["admin", "superadmin"].includes(profile.role)
  )
    return {
      error: "관리자 권한을 확인할 수 없습니다. 관리자에게 문의하세요.",
    };

  const { error } = await db.auth.updateUser({
    password,
    ...(currentPassword ? { current_password: currentPassword } : {}),
  });
  if (error)
    return {
      error:
        error.code === "same_password"
          ? "기존 비밀번호와 다른 비밀번호를 입력해 주세요."
          : currentPassword
            ? "비밀번호를 변경하지 못했습니다. 현재 비밀번호와 새 비밀번호 정책을 확인해 주세요."
            : "비밀번호를 저장하지 못했습니다. 비밀번호 정책을 확인하고 다시 시도해 주세요.",
    };

  // Password is already saved. Sign-out failure must not invite a duplicate update.
  try {
    const { error: signOutError } = await db.auth.signOut();
    return { success: true, signOutFailed: Boolean(signOutError) };
  } catch {
    return { success: true, signOutFailed: true };
  }
}
