import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  CONTENT_DEFAULT_IMAGES,
  CONTENT_PAGES,
  type ContentSlug,
  type SiteContent,
} from "@/lib/domain/contracts";
import { ContentEditor } from "../ContentEditor";
/** 고객 사이트 주소(재검증 URL의 origin)로 운영 중인 기본 이미지 주소를 만든다. 비밀값은 넘기지 않는다. */
function liveDefaultImage(slug: ContentSlug) {
  const images: Partial<Record<ContentSlug, string>> = CONTENT_DEFAULT_IMAGES;
  const path = images[slug];
  if (!path) return undefined;
  try {
    const url = new URL(process.env.WEB_REVALIDATE_URL ?? "");
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return new URL(path, url.origin).toString();
  } catch {
    return "";
  }
}
export default async function EditContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!(slug in CONTENT_PAGES)) notFound();
  const { db } = await requireAdmin();
  const { data, error } = await db
    .from("site_content")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error("조회 실패");
  const initial = (data || {
    slug,
    title: CONTENT_PAGES[slug as keyof typeof CONTENT_PAGES],
    subtitle: "",
    sections: [],
    image_url: "",
    is_published: false,
  }) as SiteContent;
  if (slug === "about") {
    if (initial.title === "고객과 함께하는 진렌트카" || initial.title === "회사소개") initial.title = "30년 이상의 경험과 신뢰";
    if (!initial.subtitle || initial.subtitle.startsWith("30년이 넘는 시간 동안")) initial.subtitle = "고객님의 여정에 항상 안전과 편안함을 더합니다.";
  }
  if (slug === "settings") {
    const { data: about, error: aboutError } = await db.from("site_content").select("sections").eq("slug", "about").maybeSingle();
    if (aboutError) throw new Error("조회 실패");
    const legacySections = (about?.sections ?? []) as SiteContent["sections"];
    for (const field of ["상호", "배차 시간"]) {
      if (initial.sections.some((section) => section.title === field && section.body.trim())) continue;
      const body = legacySections.find((section) => section.title === field)?.body.trim();
      if (body) initial.sections = [...initial.sections.filter((section) => section.title !== field), { title: field, body }];
    }
  }
  return (
    <ContentEditor
      defaultImage={liveDefaultImage(slug as ContentSlug)}
      initial={initial}
    />
  );
}
