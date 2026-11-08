"use server";

import { requireAdmin } from "@/lib/auth";
import { operationLog } from "@/lib/observability";

const uuid = /^[0-9a-f-]{36}$/i;

export async function togglePublishedField(
  table: "events" | "notices",
  id: string,
  field: "is_active" | "is_pinned",
  value: boolean,
) {
  if (
    (table !== "events" && table !== "notices") ||
    !uuid.test(id) ||
    typeof value !== "boolean" ||
    (table === "events" ? field !== "is_active" : field !== "is_pinned")
  )
    return { error: "올바르지 않은 요청입니다." };
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const { db, user } = await requireAdmin();
  const { error } = await db
    .from(table)
    .update({ [field]: value })
    .eq("id", id)
    .select("id")
    .single();
  operationLog(
    "content.toggle",
    requestId,
    error ? "failure" : "success",
    error ? "db_update" : "updated",
    startedAt,
    { actorUserId: user.id, table, recordId: id, field, value },
  );
  return error ? { error: "변경을 저장하지 못했습니다." } : { success: true };
}

export async function deletePublishedRecord(
  table: "events" | "notices",
  id: string,
) {
  if ((table !== "events" && table !== "notices") || !uuid.test(id))
    return { error: "올바르지 않은 요청입니다." };
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const { db, user } = await requireAdmin();
  const { error } = await db
    .from(table)
    .delete()
    .eq("id", id)
    .select("id")
    .single();
  operationLog(
    "content.delete",
    requestId,
    error ? "failure" : "success",
    error ? "db_delete" : "deleted",
    startedAt,
    { actorUserId: user.id, table, recordId: id },
  );
  return error ? { error: "삭제하지 못했습니다." } : { success: true };
}

export async function deleteVehicle(id: string) {
  if (!uuid.test(id)) return { error: "올바르지 않은 요청입니다." };
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const { db, user } = await requireAdmin();
  const { error } = await db
    .from("vehicles")
    .delete()
    .eq("id", id)
    .select("id")
    .single();
  operationLog(
    "vehicle.delete",
    requestId,
    error ? "failure" : "success",
    error ? "db_delete" : "deleted",
    startedAt,
    { actorUserId: user.id, table: "vehicles", recordId: id },
  );
  return error ? { error: "삭제하지 못했습니다." } : { success: true };
}

export async function addCategory(name: string) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 80)
    return { error: "카테고리 이름을 확인해주세요." };
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const { db, user } = await requireAdmin();
  const { data, error } = await db
    .from("vehicle_categories")
    .insert({ name: name.trim() })
    .select("id")
    .single();
  operationLog(
    "category.create",
    requestId,
    error ? "failure" : "success",
    error ? "db_insert" : "created",
    startedAt,
    {
      actorUserId: user.id,
      table: "vehicle_categories",
      recordId: data?.id ?? null,
    },
  );
  return error ? { error: "카테고리 추가에 실패했습니다." } : { success: true };
}

export async function deleteCategory(id: string) {
  if (!uuid.test(id)) return { error: "올바르지 않은 요청입니다." };
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const { db, user } = await requireAdmin();
  const { error } = await db
    .from("vehicle_categories")
    .delete()
    .eq("id", id)
    .select("id")
    .single();
  operationLog(
    "category.delete",
    requestId,
    error ? "failure" : "success",
    error ? "db_delete" : "deleted",
    startedAt,
    { actorUserId: user.id, table: "vehicle_categories", recordId: id },
  );
  return error
    ? { error: "카테고리를 삭제하지 못했습니다." }
    : { success: true };
}

export async function saveNotice(value: {
  id?: string;
  title: string;
  content: string;
  is_pinned: boolean;
}) {
  if (
    !value ||
    typeof value.title !== "string" ||
    !value.title.trim() ||
    value.title.length > 200 ||
    typeof value.content !== "string" ||
    !value.content.trim() ||
    value.content.length > 100000 ||
    typeof value.is_pinned !== "boolean" ||
    (value.id && !uuid.test(value.id))
  )
    return { error: "공지 내용을 확인해주세요." };
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const { db, user } = await requireAdmin();
  const payload = {
    title: value.title.trim(),
    content: value.content,
    is_pinned: value.is_pinned,
  };
  const query = value.id
    ? db.from("notices").update(payload).eq("id", value.id)
    : db.from("notices").insert({ ...payload, author_id: user.id });
  const { data, error } = await query.select("id").single();
  operationLog(
    "notice.save",
    requestId,
    error ? "failure" : "success",
    error ? "db_save" : "saved",
    startedAt,
    {
      actorUserId: user.id,
      table: "notices",
      action: value.id ? "update" : "insert",
      recordId: data?.id ?? value.id ?? null,
      isPinned: value.is_pinned,
      contentLength: value.content.length,
    },
  );
  return error ? { error: "공지사항 저장에 실패했습니다." } : { success: true };
}
