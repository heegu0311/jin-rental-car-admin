"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  recoveryEmail,
  recoveryOrigin,
  passwordRecoveryError,
} from "@/lib/password-recovery";
import { recoverAdminPassword } from "@/lib/recover-admin-password";
import { requestAdminPasswordRecovery } from "@/lib/request-password-recovery";

export async function requestPasswordRecovery(formData: FormData) {
  const email = recoveryEmail(formData.get("email"));
  if (!email) return { error: "올바른 이메일 주소를 입력해 주세요." };
  if (formData.get("consent") !== "on")
    return { error: "비밀번호 재설정을 위한 이메일 이용에 동의해 주세요." };

  // Next.js Server Actions also enforce same-origin requests. Do not accept a client-supplied redirect URL.
  const origin = recoveryOrigin((await headers()).get("origin"));
  if (!origin)
    return {
      error:
        "요청 주소를 확인할 수 없습니다. 로그인 화면에서 다시 시도해 주세요.",
    };

  try {
    const db = await createClient();
    return await requestAdminPasswordRecovery(db, email, origin);
  } catch {
    return { error: "연결에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

export async function saveRecoveredPassword(formData: FormData) {
  const password = formData.get("password");
  const validation = passwordRecoveryError(
    password,
    formData.get("confirmation"),
  );
  if (validation || typeof password !== "string")
    return { error: validation ?? "비밀번호를 확인해 주세요." };

  let result: Awaited<ReturnType<typeof recoverAdminPassword>>;
  try {
    const db = await createClient();
    result = await recoverAdminPassword(db, password);
  } catch {
    return { error: "연결에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }
  // Logout invalidates this protected page. Redirect before Next.js re-renders it.
  if (result.success && !result.signOutFailed)
    redirect("/login?success=password_reset");
  return result;
}
