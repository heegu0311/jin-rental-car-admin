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
  staffRequestNote = "",
) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const { db, user } = await requireAdmin();
  if (!validTarget(kind, id)) return { error: "올바르지 않은 요청입니다." };
  if (kind === "reservations" && !STATUSES.reservations.includes(status))
    return { error: "상태를 확인해주세요." };
  if (kind === "reservations") {
    if (typeof staffRequestNote !== "string" || staffRequestNote.length > 5000)
      return { error: "담당자 처리 요청 사항을 확인해주세요. (최대 5,000자)" };
  }
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
      ? { status, staff_request_note: staffRequestNote.trim() }
      : {
          status,
          answer_content: answered ? answer.trim() : null,
          answered_by: answered ? user.id : null,
          answered_at: answered ? new Date().toISOString() : null,
        };
  let { error } = await db
    .from(kind)
    .update(payload)
    .eq("id", id)
    .select("id")
    .single();
  if (kind === "reservations" && !staffRequestNote.trim() &&
      (error?.code === "42703" || error?.code === "PGRST204")) {
    const fallback = await db.from("reservations").update({ status }).eq("id", id).select("id").single();
    error = fallback.error;
  }
  if (error) {
    if (kind === "reservations" && (error.code === "42703" || error.code === "PGRST204"))
      return { error: "담당자 요청 메모를 저장하려면 DB 마이그레이션을 먼저 적용해야 합니다." };
    operationLog(
      "record.update",
      requestId,
      "failure",
      "db_update",
      startedAt,
      {
        actorUserId: user.id,
        table: kind,
        recordId: id,
        status,
        hasAnswer: Boolean(answer.trim()),
      },
    );
    return { error: "저장하지 못했습니다. 데이터 또는 권한을 확인해주세요." };
  }
  operationLog("record.update", requestId, "success", "updated", startedAt, {
    actorUserId: user.id,
    table: kind,
    recordId: id,
    status,
    hasAnswer: Boolean(answer.trim()),
  });
  revalidateRecordPages(kind);
  if (kind === "reservations") revalidatePath("/staff/requests");
  return { success: true };
}

export async function deleteRecord(kind: RecordKind, id: string) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const { db, user } = await requireAdmin();
  if (!validTarget(kind, id)) return { error: "올바르지 않은 요청입니다." };
  const { error } = await db
    .from(kind)
    .delete()
    .eq("id", id)
    .select("id")
    .single();
  if (error) {
    operationLog(
      "record.delete",
      requestId,
      "failure",
      "db_delete",
      startedAt,
      {
        actorUserId: user.id,
        table: kind,
        recordId: id,
      },
    );
    return { error: "삭제에 실패했습니다." };
  }
  operationLog("record.delete", requestId, "success", "deleted", startedAt, {
    actorUserId: user.id,
    table: kind,
    recordId: id,
  });
  revalidateRecordPages(kind);
  return { success: true };
}
