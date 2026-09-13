import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { CONTENT_PAGES, type SiteContent } from "@/lib/domain/contracts";
import { ContentEditor } from "../ContentEditor";
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
  return (
    <ContentEditor
      initial={
        (data || {
          slug,
          title: CONTENT_PAGES[slug as keyof typeof CONTENT_PAGES],
          subtitle: "",
          sections: [],
          image_url: "",
          is_published: false,
        }) as SiteContent
      }
    />
  );
}
