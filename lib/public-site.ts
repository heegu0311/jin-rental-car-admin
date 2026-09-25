import { refreshPublicSite } from "@/lib/web-revalidate";

export const PUBLIC_SITE_DELAY_NOTICE =
  "저장되었습니다. 고객 사이트 즉시 반영에 실패해 최대 3시간 후 반영됩니다.";

/** 저장 성공 후 호출한다. 즉시 반영에 실패하면 지연 반영을 안내한다. */
export async function refreshPublicSiteOrNotify() {
  const { ok } = await refreshPublicSite().catch(() => ({ ok: false }));
  if (!ok) window.alert(PUBLIC_SITE_DELAY_NOTICE);
}
