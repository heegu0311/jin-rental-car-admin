"use server";
import { requireAdmin } from "@/lib/auth";

/**
 * 공개 사이트(web)의 ISR 캐시를 즉시 무효화한다. 실패해도 web은 3시간 주기로 재생성된다.
 * WEB_REVALIDATE_URL/SECRET은 서버 전용 환경변수이며 공개 번들에 포함하지 않는다.
 */
export async function refreshPublicSite(): Promise<{ ok: boolean }> {
  await requireAdmin();
  const url = process.env.WEB_REVALIDATE_URL;
  const secret = process.env.WEB_REVALIDATE_SECRET;
  if (!url || !secret || !/^https?:\/\//.test(url)) return { ok: false };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return { ok: response.ok };
  } catch {
    return { ok: false };
  }
}
