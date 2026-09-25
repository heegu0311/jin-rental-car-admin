"use server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
export async function updateRecord(
  kind: "reservations" | "inquiries",
  id: string,
  status: string,
  answer = "",
) {
  const { db, user } = await requireAdmin();
  if (
    !["reservations", "inquiries"].includes(kind) ||
    !/^[0-9a-f-]{36}$/i.test(id)
  )
    return { error: "올바르지 않은 요청입니다." };
  if (
    kind === "reservations" &&
    !["pending", "confirmed", "cancelled"].includes(status)
  )
    return { error: "상태를 확인해주세요." };
  if (
    kind === "inquiries" &&
    (!["pending", "answered"].includes(status) ||
      typeof answer !== "string" ||
      answer.length > 5000 ||
      (status === "answered" && !answer.trim()))
  )
    return { error: "답변 내용을 입력해주세요. (최대 5,000자)" };
  const payload =
    kind === "reservations"
      ? { status }
      : {
          status,
          answer_content: status === "answered" ? answer.trim() : null,
          answered_by: status === "answered" ? user.id : null,
          answered_at: status === "answered" ? new Date().toISOString() : null,
        };
  const { error } = await db
    .from(kind)
    .update(payload)
    .eq("id", id)
    .select("id")
    .single();
  if (error)
    return { error: "저장하지 못했습니다. 데이터 또는 권한을 확인해주세요." };
  revalidatePath(`/${kind}`);
  if (kind === "reservations") revalidatePath("/new-car");
  revalidatePath("/");
  return { success: true };
}
export async function deleteRecord(
  kind: "reservations" | "inquiries",
  id: string,
) {
  const { db } = await requireAdmin();
  if (
    !["reservations", "inquiries"].includes(kind) ||
    !/^[0-9a-f-]{36}$/i.test(id)
  )
    return { error: "올바르지 않은 요청입니다." };
  const { error } = await db
    .from(kind)
    .delete()
    .eq("id", id)
    .select("id")
    .single();
  if (error) return { error: "삭제에 실패했습니다." };
  revalidatePath(`/${kind}`);
  if (kind === "reservations") revalidatePath("/new-car");
  return { success: true };
}
