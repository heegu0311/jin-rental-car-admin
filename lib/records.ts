"use server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { operationLog } from "@/lib/observability";

export type RecordKind = "reservations" | "inquiries";

const RECORD_KINDS: readonly string[] = ["reservations", "inquiries"];
const STATUSES: Record<RecordKind, readonly string[]> = {
  reservations: ["pending", "confirmed", "cancelled"],
  inquiries: ["pending", "answered"],
};
const ANSWER_MAX = 5000;

function validTarget(kind: unknown, id: unknown): kind is RecordKind {
  return (
    RECORD_KINDS.includes(kind as string) &&
    typeof id === "string" &&
    /^[0-9a-f-]{36}$/i.test(id)
  );
}

/** 예약/문의 목록과 대시보드를 다시 그린다. 예약은 신차 상담 목록에도 보인다. */
function revalidateRecordPages(kind: RecordKind) {
  revalidatePath(`/${kind}`);
  if (kind === "reservations") revalidatePath("/new-car");
  revalidatePath("/consultations");
  revalidatePath("/");
}

export async function updateRecord(
  kind: RecordKind,
  id: string,
  status: string,
  answer = "",
) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const { db, user } = await requireAdmin();
  if (!validTarget(kind, id)) return { error: "올바르지 않은 요청입니다." };
  if (kind === "reservations" && !STATUSES.reservations.includes(status))
    return { error: "상태를 확인해주세요." };
  if (
    kind === "inquiries" &&
    (!STATUSES.inquiries.includes(status) ||
      typeof answer !== "string" ||
      answer.length > ANSWER_MAX ||
      (status === "answered" && !answer.trim()))
  )
    return { error: "답변 내용을 입력해주세요. (최대 5,000자)" };
  const answered = status === "answered";
  const payload =
    kind === "reservations"
      ? { status }
      : {
          status,
          answer_content: answered ? answer.trim() : null,
          answered_by: answered ? user.id : null,
          answered_at: answered ? new Date().toISOString() : null,
        };
  const { error } = await db
    .from(kind)
    .update(payload)
    .eq("id", id)
    .select("id")
    .single();
  if (error) {
    operationLog("record.update", requestId, "failure", "db_update", startedAt);
    return { error: "저장하지 못했습니다. 데이터 또는 권한을 확인해주세요." };
  }
  operationLog("record.update", requestId, "success", "updated", startedAt);
  revalidateRecordPages(kind);
  return { success: true };
}

export async function deleteRecord(kind: RecordKind, id: string) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const { db } = await requireAdmin();
  if (!validTarget(kind, id)) return { error: "올바르지 않은 요청입니다." };
  const { error } = await db
    .from(kind)
    .delete()
    .eq("id", id)
    .select("id")
    .single();
  if (error) {
    operationLog("record.delete", requestId, "failure", "db_delete", startedAt);
    return { error: "삭제에 실패했습니다." };
  }
  operationLog("record.delete", requestId, "success", "deleted", startedAt);
  revalidateRecordPages(kind);
  return { success: true };
}
