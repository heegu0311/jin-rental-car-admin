import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  ABOUT_DEFAULT_IMAGE,
  ABOUT_DEFAULTS,
  ABOUT_FIELDS,
  ABOUT_SETTING_KEYS,
  CONTENT_PAGES,
  type AboutField,
  type SiteContent,
} from "@/lib/domain/contracts";
import { ContentEditor } from "../ContentEditor";
/** 고객 사이트 주소(재검증 URL의 origin)로 운영 중인 회사소개 기본 배너 주소를 만든다. 비밀값은 넘기지 않는다. */
function liveDefaultAboutImage() {
  try {
    const url = new URL(process.env.WEB_REVALIDATE_URL ?? "");
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return new URL(ABOUT_DEFAULT_IMAGE, url.origin).toString();
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
  // 회사소개 항목을 비웠을 때 웹에 표시될 값을 입력 안내로 보여준다.
  let fallbacks: Partial<Record<AboutField, string>> | undefined;
  if (slug === "about") {
    const { data: settings, error: settingsError } = await db
      .from("site_content")
      .select("sections")
      .eq("slug", "settings")
      .maybeSingle();
    if (settingsError) throw new Error("조회 실패");
    const sections = (settings?.sections ?? []) as SiteContent["sections"];
    fallbacks = Object.fromEntries(
      ABOUT_FIELDS.map((field) => {
        const key = ABOUT_SETTING_KEYS[field];
        const value = key
          ? sections.find((s) => s.title === key)?.body.trim()
          : undefined;
        return [field, value || ABOUT_DEFAULTS[field] || ""];
      }),
    );
  }
  const initial = (data || {
    slug,
    title: CONTENT_PAGES[slug as keyof typeof CONTENT_PAGES],
    subtitle: "",
    sections: [],
    image_url: "",
    is_published: false,
  }) as SiteContent;
  // 회사소개는 고정 항목만 저장하므로 이전 자유 섹션은 항목 순서로 정리해 편집한다.
  if (slug === "about")
    initial.sections = ABOUT_FIELDS.map((field) => ({
      title: field,
      body: initial.sections.find((s) => s.title === field)?.body ?? "",
    }));
  return (
    <ContentEditor
      fallbacks={fallbacks}
      defaultImage={slug === "about" ? liveDefaultAboutImage() : undefined}
      initial={initial}
    />
  );
}
