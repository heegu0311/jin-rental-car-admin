"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { parseEventForm } from "@/lib/domain/event-form";
import { refreshPublicSite } from "@/lib/web-revalidate";
import { parsePopupOrderIds } from "@/lib/domain/popup-order";
import { operationLog } from "@/lib/observability";

export async function saveEvent(value: unknown) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const { db } = await requireAdmin();
  const event = parseEventForm(value);
  if (!event)
    return {
      error: "제목·이미지 주소·공개 기간을 확인해주세요.",
    };
  const mutation = event.id
    ? db.from("events").update(event.data).eq("id", event.id)
    : db.from("events").insert(event.data);
  const { data, error } = await mutation.select("id").single();
  if (error) {
    operationLog("event.save", requestId, "failure", "db_save", startedAt, {
      table: "events",
      action: event.id ? "update" : "insert",
      recordId: event.id ?? null,
    });
    return {
      error: "이벤트를 저장하지 못했습니다. 연결 상태와 권한을 확인해주세요.",
    };
  }
  operationLog("event.save", requestId, "success", "saved", startedAt, {
    table: "events",
    action: event.id ? "update" : "insert",
    recordId: data.id,
    isActive: event.data.is_active,
    isPopup: event.data.is_popup,
  });
  revalidatePath("/events");
  const site = await refreshPublicSite();
  return { success: true as const, site };
}

export async function savePopupOrder(value: unknown) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const { db } = await requireAdmin();
  const ids = parsePopupOrderIds(value);
  if (!ids) return { error: "팝업 목록을 확인하고 다시 시도해주세요." };
  const { error } = await db.rpc("reorder_event_popups", { event_ids: ids });
  if (error) {
    operationLog("event.reorder", requestId, "failure", "db_rpc", startedAt, {
      table: "events",
      itemCount: ids.length,
    });
    return {
      error:
        "순서를 저장하지 못했습니다. 팝업 목록이 변경되었을 수 있으니 새로고침 후 다시 시도해주세요.",
    };
  }
  operationLog("event.reorder", requestId, "success", "reordered", startedAt, {
    table: "events",
    itemCount: ids.length,
  });
  revalidatePath("/events");
  const site = await refreshPublicSite();
  return { success: true as const, site };
}
