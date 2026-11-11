"use server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { operationLog } from "@/lib/observability";
import type { ReservationConsultationResultInput } from "@/lib/domain/consultation-result";
import { VEHICLE_OPTIONS } from "@/lib/domain/contracts";

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
  return { success: true };
}

const OUTCOME_MAX_AMOUNT = 100_000_000;
const OUTCOME_MAX_NOTE = 1000;

export async function saveReservationOutcome(
  id: string,
  outcome: ReservationConsultationResultInput,
) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const { db, user } = await requireAdmin();
  const validAmount = (value: number | null) =>
    value === null ||
    (Number.isInteger(value) && value >= 0 && value <= OUTCOME_MAX_AMOUNT);
  const maxPeriod =
    outcome?.rental_type === "daily"
      ? 30
      : outcome?.rental_type === "weekly"
        ? 8
        : 60;
  if (
    !validTarget("reservations", id) ||
    !outcome ||
    !["daily", "weekly", "monthly"].includes(outcome.rental_type) ||
    !Number.isInteger(outcome.period_count) ||
    outcome.period_count < 1 ||
    outcome.period_count > maxPeriod ||
    typeof outcome.car_name !== "string" ||
    outcome.car_name.length < 1 ||
    outcome.car_name.length > 200 ||
    (outcome.vehicle_id !== null &&
      (typeof outcome.vehicle_id !== "string" ||
        !/^[0-9a-f-]{36}$/i.test(outcome.vehicle_id))) ||
    typeof outcome.rental_start !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(outcome.rental_start) ||
    (outcome.rental_end !== null &&
      (typeof outcome.rental_end !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(outcome.rental_end))) ||
    typeof outcome.package_km !== "string" ||
    outcome.package_km.length > 80 ||
    !Array.isArray(outcome.vehicle_options) ||
    outcome.vehicle_options.length > VEHICLE_OPTIONS.length ||
    new Set(outcome.vehicle_options).size !== outcome.vehicle_options.length ||
    !outcome.vehicle_options.every((option) =>
      (VEHICLE_OPTIONS as readonly string[]).includes(option),
    ) ||
    typeof outcome.insurance_age !== "string" ||
    outcome.insurance_age.length > 40 ||
    typeof outcome.insurance_plan !== "string" ||
    outcome.insurance_plan.length > 100 ||
    !validAmount(outcome.rental_total) ||
    !validAmount(outcome.insurance_min) ||
    !validAmount(outcome.insurance_max) ||
    (outcome.insurance_min !== null &&
      outcome.insurance_max !== null &&
      outcome.insurance_max < outcome.insurance_min) ||
    !validAmount(outcome.total_min) ||
    !validAmount(outcome.total_max) ||
    (outcome.total_min !== null &&
      outcome.total_max !== null &&
      outcome.total_max < outcome.total_min) ||
    !validAmount(outcome.deposit_amount) ||
    typeof outcome.note !== "string" ||
    outcome.note.length > OUTCOME_MAX_NOTE
  )
    return { error: "상담 결과를 확인해주세요." };

  const stored = {
    ...outcome,
    note: outcome.note.trim().replace(/[\r\n]+/g, " "),
    reservation_id: id,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };
  const { error } = await db
    .from("reservation_consultation_results")
    .upsert(stored, { onConflict: "reservation_id" })
    .select("reservation_id")
    .single();
  if (error) {
    operationLog(
      "reservation.outcome.save",
      requestId,
      "failure",
      "db_update",
      startedAt,
      {
        actorUserId: user.id,
        recordId: id,
      },
    );
    return { error: "상담 결과를 저장하지 못했습니다." };
  }
  operationLog(
    "reservation.outcome.save",
    requestId,
    "success",
    "saved",
    startedAt,
    {
      actorUserId: user.id,
      recordId: id,
    },
  );
  revalidateRecordPages("reservations");
  return { success: true, outcome: stored };
}

export async function saveReservationStaffRequest(
  id: string,
  staffRequest: string,
) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const { db, user } = await requireAdmin();
  if (
    !validTarget("reservations", id) ||
    typeof staffRequest !== "string" ||
    staffRequest.length > OUTCOME_MAX_NOTE
  )
    return { error: "담당자 처리 요청사항을 확인해주세요." };
  const { data, error } = await db
    .from("reservations")
    .update({ staff_request: staffRequest.trim() })
    .eq("id", id)
    .select("id, staff_request")
    .single();
  if (error) {
    operationLog(
      "reservation.staff_request.save",
      requestId,
      "failure",
      "db_update",
      startedAt,
      { actorUserId: user.id, recordId: id },
    );
    return { error: "담당자 처리 요청사항을 저장하지 못했습니다." };
  }
  operationLog(
    "reservation.staff_request.save",
    requestId,
    "success",
    "saved",
    startedAt,
    { actorUserId: user.id, recordId: id },
  );
  revalidateRecordPages("reservations");
  return {
    success: true as const,
    staffRequest: {
      reservation_id: data.id,
      staff_request: data.staff_request,
    },
  };
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
