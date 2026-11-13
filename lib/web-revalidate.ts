"use server";
import { requireAdmin } from "@/lib/auth";
import { operationLog } from "@/lib/observability";

export type PublicSiteRefresh = { ok: true } | { ok: false; reason: string };

function failed(reason: string): PublicSiteRefresh {
  return { ok: false, reason };
}

/**
 * 공개 사이트(web)의 ISR 캐시를 무효화한다. 실패하면 경로별 1~3시간 주기로 재생성된다.
 * WEB_REVALIDATE_URL/SECRET은 서버 전용 환경변수이며 공개 번들에 포함하지 않는다.
 * 실패 사유에는 설정 이름과 응답 상태만 담고 비밀값은 담지 않는다.
 */
export async function refreshPublicSite(vehicleId?: string): Promise<PublicSiteRefresh> {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const fail = (reason: string, code: string) => {
    operationLog("public_site.refresh", requestId, "failure", code, startedAt);
    return failed(reason);
  };
  await requireAdmin();
  const url = process.env.WEB_REVALIDATE_URL;
  const secret = process.env.WEB_REVALIDATE_SECRET;
  if (!url || !secret)
    return fail(
      "관리자 서버에 WEB_REVALIDATE_URL 또는 WEB_REVALIDATE_SECRET이 설정되지 않았습니다.",
      "missing_config",
    );
  if (!/^https?:\/\//.test(url))
    return fail("WEB_REVALIDATE_URL은 http(s) 주소여야 합니다.", "invalid_url");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "x-request-id": requestId,
        "Content-Type": "application/json",
      },
      body: vehicleId ? JSON.stringify({ vehicleId }) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      operationLog("public_site.refresh", requestId, "success", "revalidated", startedAt);
      return { ok: true };
    }
    if (response.status === 401)
      return fail(
        "고객 사이트가 인증을 거부했습니다(401). web의 REVALIDATE_SECRET과 값이 같은지 확인해주세요.",
        "unauthorized",
      );
    if (response.status === 404)
      return fail(
        "고객 사이트에서 재검증 주소를 찾지 못했습니다(404). WEB_REVALIDATE_URL과 web 배포 상태를 확인해주세요.",
        "not_found",
      );
    return fail(`고객 사이트 응답 오류(${response.status}).`, "http_error");
  } catch {
    return fail(
      "고객 사이트에 연결하지 못했습니다(연결 실패 또는 5초 초과).",
      "network_error",
    );
  }
}
