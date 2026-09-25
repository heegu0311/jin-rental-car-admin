import { toast } from "sonner";
import { refreshPublicSite } from "@/lib/web-revalidate";

export const PUBLIC_SITE_DELAY_NOTICE =
  "고객 사이트 즉시 반영에 실패해 최대 3시간 후 반영됩니다.";

/** 저장 결과를 알린다. 고객 사이트 즉시 반영에 실패하면 지연 반영을 함께 안내한다. */
export function notifySaved(message: string, siteRefreshed: boolean) {
  if (siteRefreshed) toast.success(message);
  else toast.warning(message, { description: PUBLIC_SITE_DELAY_NOTICE });
}

/** 저장 성공 후 호출한다. 즉시 반영 결과에 따라 성공 또는 지연 반영을 안내한다. */
export async function refreshPublicSiteOrNotify(message: string) {
  const { ok } = await refreshPublicSite().catch(() => ({ ok: false }));
  notifySaved(message, ok);
}
