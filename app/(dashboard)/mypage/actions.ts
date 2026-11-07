"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { validProfileName } from "@/lib/account";
import { passwordRecoveryError } from "@/lib/password-recovery";
import { recoverAdminPassword } from "@/lib/recover-admin-password";

export async function saveAccountProfile(formData: FormData) {
  const name = validProfileName(formData.get("name"));
  if (!name)
    return { error: "프로필 이름은 줄바꿈 없이 1~40자로 입력해 주세요." };
  const { db } = await requireAdmin();
  try {
    const { error } = await db.auth.updateUser({
      data: { display_name: name },
    });
    if (error)
      return { error: "프로필을 저장하지 못했습니다. 다시 시도해 주세요." };
  } catch {
    return { error: "연결에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }
  revalidatePath("/", "layout");
  return { success: true };
}

export async function changeAccountPassword(formData: FormData) {
  const password = formData.get("password");
  const validation = passwordRecoveryError(
    password,
    formData.get("confirmation"),
  );
  if (validation || typeof password !== "string")
    return { error: validation ?? "비밀번호를 확인해 주세요." };
  const current = formData.get("currentPassword");
  if (typeof current !== "string" || !current || current.length > 1024)
    return { error: "현재 비밀번호를 입력해 주세요." };
  const { db } = await requireAdmin();
  let result: Awaited<ReturnType<typeof recoverAdminPassword>>;
  try {
    result = await recoverAdminPassword(db, password, current);
  } catch {
    return { error: "연결에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (result.success && !result.signOutFailed)
    redirect("/login?success=password_reset");
  return result;
}
