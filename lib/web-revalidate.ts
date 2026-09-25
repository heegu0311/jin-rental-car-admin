"use server";
import { requireAdmin } from "@/lib/auth";

export type PublicSiteRefresh = { ok: true } | { ok: false; reason: string };

function failed(reason: string): PublicSiteRefresh {
  console.warn(`[public-site-refresh] ${reason}`);
  return { ok: false, reason };
}

/**
 * 공개 사이트(web)의 ISR 캐시를 즉시 무효화한다. 실패해도 web은 3시간 주기로 재생성된다.
 * WEB_REVALIDATE_URL/SECRET은 서버 전용 환경변수이며 공개 번들에 포함하지 않는다.
 * 실패 사유에는 설정 이름과 응답 상태만 담고 비밀값은 담지 않는다.
 */
export async function refreshPublicSite(): Promise<PublicSiteRefresh> {
  await requireAdmin();
  const url = process.env.WEB_REVALIDATE_URL;
  const secret = process.env.WEB_REVALIDATE_SECRET;
  if (!url || !secret)
    return failed(
      "관리자 서버에 WEB_REVALIDATE_URL 또는 WEB_REVALIDATE_SECRET이 설정되지 않았습니다.",
    );
  if (!/^https?:\/\//.test(url))
    return failed("WEB_REVALIDATE_URL은 http(s) 주소여야 합니다.");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) return { ok: true };
    if (response.status === 401)
      return failed(
        "고객 사이트가 인증을 거부했습니다(401). web의 REVALIDATE_SECRET과 값이 같은지 확인해주세요.",
      );
    if (response.status === 404)
      return failed(
        "고객 사이트에서 재검증 주소를 찾지 못했습니다(404). WEB_REVALIDATE_URL과 web 배포 상태를 확인해주세요.",
      );
    return failed(`고객 사이트 응답 오류(${response.status}).`);
  } catch {
    return failed(
      "고객 사이트에 연결하지 못했습니다(연결 실패 또는 5초 초과).",
    );
  }
}
