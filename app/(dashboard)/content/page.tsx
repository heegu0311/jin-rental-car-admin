import Link from "next/link";
import { ArrowRight, Eye, MapPin, PencilLine } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { CONTENT_PAGES, type SiteContent } from "@/lib/domain/contracts";
import { PageHeading, StatusBadge } from "@/components/shared/feedback";
import { CONTENT_GROUPS, CONTENT_GUIDES } from "./contentGuide";

export default async function ContentPage() {
  const { db } = await requireAdmin();
  const { data, error } = await db.from("site_content").select("*");
  if (error) throw new Error("콘텐츠 조회 실패");
  const rows = (data || []) as SiteContent[];
  const rowsBySlug = new Map(rows.map((row) => [row.slug, row]));

  return (
    <div className="space-y-8">
      <PageHeading
        title="웹사이트 콘텐츠"
        description="수정하려는 웹사이트 영역을 선택하세요. 각 항목에 실제 노출 위치와 수정되는 내용을 표시했습니다."
      />

      <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white">
            <Eye size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">
              수정 내용은 이렇게 반영됩니다
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              항목을 선택해 내용을 저장한 뒤 <strong>웹사이트에 공개</strong>를
              켜면, 표시된 공개 경로에서 새 내용을 확인할 수 있습니다.
            </p>
          </div>
        </div>
        <ol className="mt-5 grid gap-3 text-sm md:grid-cols-3">
          {[
            ["1", "영역 선택", "아래 카드에서 노출 위치를 확인합니다."],
            ["2", "내용 편집", "제목·이미지·내용 섹션을 수정합니다."],
            ["3", "공개 후 확인", "저장한 다음 실제 웹페이지를 확인합니다."],
          ].map(([number, title, body]) => (
            <li
              key={number}
              className="rounded-xl bg-white p-4 shadow-sm shadow-blue-950/5"
            >
              <span className="text-xs font-bold text-blue-600">
                STEP {number}
              </span>
              <strong className="mt-1 block text-slate-900">{title}</strong>
              <p className="mt-1 leading-5 text-slate-500">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {CONTENT_GROUPS.map((group) => (
        <section key={group.title} className="space-y-4">
          <header>
            <h2 className="text-lg font-bold text-slate-900">{group.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{group.description}</p>
          </header>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {group.slugs.map((slug) => {
              const label = CONTENT_PAGES[slug];
              const guide = CONTENT_GUIDES[slug];
              const row = rowsBySlug.get(slug);

              return (
                <Link
                  href={`/content/${slug}`}
                  key={slug}
                  aria-label={`${label} 내용 편집`}
                  className="group flex min-h-72 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{label}</p>
                      <code className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        {guide.route}
                      </code>
                    </div>
                    <StatusBadge
                      tone={row?.is_published ? "published" : "draft"}
                    >
                      {row?.is_published ? "공개" : "초안"}
                    </StatusBadge>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="flex gap-3">
                      <MapPin
                        className="mt-0.5 shrink-0 text-blue-600"
                        size={17}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          노출 위치
                        </p>
                        <p className="mt-1 text-sm leading-5 text-slate-700">
                          {guide.placement}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <PencilLine
                        className="mt-0.5 shrink-0 text-blue-600"
                        size={17}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          수정되는 내용
                        </p>
                        <p className="mt-1 text-sm leading-5 text-slate-700">
                          {guide.summary}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-5 flex flex-wrap gap-2"
                    aria-label="화면 구성"
                  >
                    {guide.preview.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5 text-sm font-semibold text-blue-600">
                    <span>{row?.title || "내용을 등록해주세요."}</span>
                    <ArrowRight
                      className="shrink-0 transition-transform group-hover:translate-x-1"
                      size={17}
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
