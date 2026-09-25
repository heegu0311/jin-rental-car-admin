"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Eye, ImageIcon, LayoutTemplate, MapPin, Type } from "lucide-react";
import {
  CONTENT_PAGES,
  type ContentSlug,
  type SiteContent,
} from "@/lib/domain/contracts";
import { PageHeading, Feedback } from "@/components/shared/feedback";
import { saveContent } from "./actions";
import { PUBLIC_SITE_DELAY_NOTICE } from "@/lib/public-site";
import { ImageUploadField } from "@/components/shared/ImageUploadField";
import {
  CONTENT_GUIDES,
  type ContentFieldGuide,
  type ContentGuide,
} from "./contentGuide";

function FieldGuide({ guide }: { guide: ContentFieldGuide }) {
  return (
    <span
      className={`mt-1 block text-xs font-normal leading-5 ${
        guide.isVisible ? "text-slate-500" : "text-amber-700"
      }`}
    >
      {guide.isVisible ? null : (
        <strong className="mr-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold">
          현재 미사용
        </strong>
      )}
      {guide.description}
    </span>
  );
}

function LocationGuide({ guide }: { guide: ContentGuide }) {
  return (
    <section className="grid overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-slate-950/5 lg:grid-cols-[1fr_360px]">
      <div className="p-6 md:p-8">
        <p className="text-xs font-bold tracking-wider text-blue-600">
          어디에 표시되나요?
        </p>
        <div className="mt-4 flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <MapPin size={19} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">{guide.placement}</h2>
            <code className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              공개 경로 {guide.route}
            </code>
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-600">{guide.summary}</p>
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <Eye size={15} aria-hidden="true" />
          공개 상태로 저장한 뒤 해당 화면을 새로 열어 확인하세요.
        </p>
      </div>

      <div className="border-t border-blue-100 bg-slate-50 p-5 lg:border-l lg:border-t-0">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3">
            <span className="size-2 rounded-full bg-red-300" />
            <span className="size-2 rounded-full bg-amber-300" />
            <span className="size-2 rounded-full bg-emerald-300" />
            <span className="ml-2 text-[10px] font-medium text-slate-400">
              화면 구성
            </span>
          </div>
          <div className="space-y-2 p-4">
            {guide.preview.map((item, index) => (
              <div
                key={item}
                className={`rounded-lg border px-3 py-2.5 text-xs font-semibold ${
                  index === 0
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ContentEditor({ initial }: { initial: SiteContent }) {
  const [draft, setDraft] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [siteRefreshed, setSiteRefreshed] = useState(true);
  const lock = useRef(false);
  const slug = draft.slug as ContentSlug;
  const guide = CONTENT_GUIDES[slug];
  const label = CONTENT_PAGES[slug];
  const input =
    "mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const update = (next: SiteContent) => {
    setDraft(next);
    setSaved(false);
  };
  return (
    <form
      className="max-w-5xl space-y-8"
      onSubmit={async (e) => {
        e.preventDefault();
        if (lock.current) return;
        lock.current = true;
        setBusy(true);
        setError("");
        setSaved(false);
        try {
          const r = await saveContent(draft);
          if (r.error) setError(r.error);
          else {
            setSiteRefreshed(r.siteRefreshed !== false);
            setSaved(true);
          }
        } catch {
          setError("저장 요청에 실패했습니다. 다시 시도해주세요.");
        } finally {
          lock.current = false;
          setBusy(false);
        }
      }}
    >
      <PageHeading
        title={`${label} 편집`}
        description="각 입력 항목 아래에서 실제 웹사이트에 표시되는 위치를 확인할 수 있습니다."
        actions={
          <Link
            href="/content"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
          >
            콘텐츠 목록
          </Link>
        }
      />
      <LocationGuide guide={guide} />
      <Feedback message={error} />
      <Feedback
        tone="success"
        message={
          !saved
            ? ""
            : siteRefreshed
              ? "저장되었습니다. 공개 상태와 웹사이트 내용을 확인해주세요."
              : PUBLIC_SITE_DELAY_NOTICE
        }
      />
      <fieldset
        disabled={busy}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <label className="block text-sm font-semibold">
          <span className="flex items-center gap-2">
            <Type size={16} className="text-blue-600" aria-hidden="true" /> 제목
          </span>
          <FieldGuide guide={guide.fields.title} />
          <input
            className={input}
            required
            maxLength={200}
            value={draft.title}
            onChange={(e) => update({ ...draft, title: e.target.value })}
          />
        </label>
        <label className="block text-sm font-semibold">
          <span className="flex items-center gap-2">
            <LayoutTemplate
              size={16}
              className="text-blue-600"
              aria-hidden="true"
            />
            소개 / 부제목
          </span>
          <FieldGuide guide={guide.fields.subtitle} />
          <textarea
            rows={3}
            className={input}
            maxLength={3000}
            value={draft.subtitle}
            onChange={(e) => update({ ...draft, subtitle: e.target.value })}
          />
        </label>
        <div className="text-sm font-semibold">
          <span className="flex items-center gap-2">
            <ImageIcon size={16} className="text-blue-600" aria-hidden="true" />{" "}
            대표 이미지
          </span>
          <FieldGuide guide={guide.fields.image} />
          <div className="mt-2">
            <ImageUploadField
              value={draft.image_url}
              onChange={(image_url) => update({ ...draft, image_url })}
              folder={`content-${slug}`}
              preview
            />
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4"
            checked={draft.is_published}
            onChange={(e) =>
              update({ ...draft, is_published: e.target.checked })
            }
          />
          <span>
            <strong className="block text-slate-900">웹사이트에 공개</strong>
            <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
              켜고 저장하면 위에 안내된 공개 영역에 반영됩니다. 검토 중이라면 끈
              상태로 저장하세요.
            </span>
          </span>
        </label>
        <p className="text-xs leading-6 text-slate-500">
          초안은 웹사이트에 노출되지 않습니다. 안내·약관 페이지의 초안은 기존
          화면을 유지합니다. 연락처와 상담 채널은 실제 운영 정보를 입력해주세요.
        </p>
      </fieldset>
      <fieldset disabled={busy} className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">내용 섹션</h2>
            <FieldGuide guide={guide.fields.sections} />
          </div>
          <button
            type="button"
            disabled={
              draft.sections.length >= 40 || !guide.fields.sections.isVisible
            }
            title={
              guide.fields.sections.isVisible
                ? "내용 섹션 추가"
                : "이 화면에서는 내용 섹션을 사용하지 않습니다."
            }
            onClick={() =>
              update({
                ...draft,
                sections: [...draft.sections, { title: "", body: "" }],
              })
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            섹션 추가
          </button>
        </div>
        {draft.sections.map((s, i) => (
          <section
            key={i}
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-6"
          >
            <div className="flex justify-between">
              <span className="text-xs font-bold text-blue-600">
                SECTION {i + 1}
              </span>
              <div className="flex gap-4">
                <button
                  type="button"
                  disabled={i === 0}
                  className="text-xs disabled:opacity-30"
                  onClick={() => {
                    const sections = [...draft.sections];
                    [sections[i - 1], sections[i]] = [
                      sections[i],
                      sections[i - 1],
                    ];
                    update({ ...draft, sections });
                  }}
                >
                  위로
                </button>
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() =>
                    update({
                      ...draft,
                      sections: draft.sections.filter((_, j) => j !== i),
                    })
                  }
                >
                  삭제
                </button>
              </div>
            </div>
            <label className="block text-sm">
              섹션 제목
              <input
                className={input}
                maxLength={200}
                value={s.title}
                onChange={(e) =>
                  update({
                    ...draft,
                    sections: draft.sections.map((v, j) =>
                      j === i ? { ...v, title: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
            <label className="block text-sm">
              내용
              <textarea
                className={input}
                rows={5}
                maxLength={15000}
                value={s.body}
                onChange={(e) =>
                  update({
                    ...draft,
                    sections: draft.sections.map((v, j) =>
                      j === i ? { ...v, body: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
          </section>
        ))}
      </fieldset>
      <button
        disabled={busy}
        className="sticky bottom-4 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg disabled:opacity-50"
      >
        {busy ? "저장 중…" : "변경사항 저장"}
      </button>
    </form>
  );
}
