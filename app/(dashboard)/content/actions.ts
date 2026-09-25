"use server";
import { requireAdmin } from "@/lib/auth";
import { CONTENT_PAGES, type SiteContent } from "@/lib/domain/contracts";
import { revalidatePath } from "next/cache";
import { refreshPublicSite } from "@/lib/web-revalidate";
export async function saveContent(value: SiteContent) {
  const { db } = await requireAdmin();
  if (
    !value ||
    !(value.slug in CONTENT_PAGES) ||
    typeof value.title !== "string" ||
    !value.title.trim() ||
    value.title.length > 200 ||
    typeof value.subtitle !== "string" ||
    value.subtitle.length > 3000 ||
    !Array.isArray(value.sections) ||
    value.sections.length > 40 ||
    typeof value.is_published !== "boolean"
  )
    return { error: "제목과 입력 항목을 확인해주세요." };
  if (
    value.sections.some(
      (s) =>
        typeof s.title !== "string" ||
        typeof s.body !== "string" ||
        s.title.length > 200 ||
        s.body.length > 15000,
    )
  )
    return { error: "섹션 제목 또는 내용이 너무 깁니다." };
  if (
    typeof value.image_url !== "string" ||
    value.image_url.length > 2000 ||
    (value.image_url &&
      !/^https:\/\//.test(value.image_url) &&
      !/^\/(?!\/)/.test(value.image_url))
  )
    return {
      error: "이미지는 https URL 또는 사이트 내부 경로를 입력해주세요.",
    };
  const payload = {
    slug: value.slug,
    title: value.title.trim(),
    subtitle: value.subtitle.trim(),
    sections: value.sections,
    image_url: value.image_url.trim(),
    is_published: value.is_published,
    updated_at: new Date().toISOString(),
  };
  const { error } = await db
    .from("site_content")
    .upsert(payload)
    .select("slug")
    .single();
  if (error)
    return { error: "저장하지 못했습니다. 연결 상태와 권한을 확인해주세요." };
  revalidatePath("/content");
  revalidatePath(`/content/${value.slug}`);
  const site = await refreshPublicSite();
  return { success: true, siteRefreshed: site.ok };
}
