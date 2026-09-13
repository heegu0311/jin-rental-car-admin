import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { CONTENT_PAGES, type SiteContent } from "@/lib/domain/contracts";
import { PageHeading, StatusBadge } from "@/components/shared/feedback";
export default async function ContentPage() {
  const { db } = await requireAdmin();
  const { data, error } = await db.from("site_content").select("*");
  if (error) throw new Error("콘텐츠 조회 실패");
  const rows = (data || []) as SiteContent[];
  return (
    <div className="space-y-8">
      <PageHeading
        title="웹사이트 콘텐츠"
        description="안내 페이지, 메인 배너, 특장점과 사업자 정보를 관리합니다."
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(CONTENT_PAGES).map(([slug, label]) => {
          const row = rows.find((r) => r.slug === slug);
          return (
            <Link
              href={`/content/${slug}`}
              key={slug}
              className="rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-400"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold">{label}</h2>
                <StatusBadge tone={row?.is_published ? "published" : "draft"}>
                  {row?.is_published ? "공개" : "초안"}
                </StatusBadge>
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-slate-500">
                {row?.title || "내용을 등록해주세요."}
              </p>
              <p className="mt-6 text-xs font-semibold text-blue-600">
                내용 편집 →
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
