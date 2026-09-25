import { toast } from "sonner";
import {
  refreshPublicSite,
  type PublicSiteRefresh,
} from "@/lib/web-revalidate";

export const PUBLIC_SITE_DELAY_NOTICE =
  "고객 사이트 즉시 반영에 실패해 최대 3시간 후 반영됩니다.";

/** 저장 결과를 알린다. 고객 사이트 즉시 반영에 실패하면 지연 반영을 함께 안내한다. */
export function notifySaved(message: string, site: PublicSiteRefresh) {
  if (site.ok) toast.success(message);
  else
    toast.warning(message, {
      description: `${PUBLIC_SITE_DELAY_NOTICE} (${site.reason})`,
    });
}

/** 저장 성공 후 호출한다. 즉시 반영 결과에 따라 성공 또는 지연 반영을 안내한다. */
export async function refreshPublicSiteOrNotify(message: string) {
  const site = await refreshPublicSite().catch((): PublicSiteRefresh => ({
    ok: false,
    reason: "즉시 반영 요청을 보내지 못했습니다.",
  }));
  notifySaved(message, site);
}
