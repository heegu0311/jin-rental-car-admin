"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { parseEventForm } from "@/lib/domain/event-form";
import { refreshPublicSite } from "@/lib/web-revalidate";
import { parsePopupOrderIds } from "@/lib/domain/popup-order";

export async function saveEvent(value: unknown) {
  const { db } = await requireAdmin();
  const event = parseEventForm(value);
  if (!event)
    return {
      error: "제목·이미지 주소·공개 기간을 확인해주세요.",
    };
  const mutation = event.id
    ? db.from("events").update(event.data).eq("id", event.id)
    : db.from("events").insert(event.data);
  const { error } = await mutation.select("id").single();
  if (error)
    return {
      error: "이벤트를 저장하지 못했습니다. 연결 상태와 권한을 확인해주세요.",
    };
  revalidatePath("/events");
  const site = await refreshPublicSite();
  return { success: true as const, site };
}

export async function savePopupOrder(value: unknown) {
  const { db } = await requireAdmin();
  const ids = parsePopupOrderIds(value);
  if (!ids) return { error: "팝업 목록을 확인하고 다시 시도해주세요." };
  const { error } = await db.rpc("reorder_event_popups", { event_ids: ids });
  if (error)
    return {
      error:
        "순서를 저장하지 못했습니다. 팝업 목록이 변경되었을 수 있으니 새로고침 후 다시 시도해주세요.",
    };
  revalidatePath("/events");
  const site = await refreshPublicSite();
  return { success: true as const, site };
}
