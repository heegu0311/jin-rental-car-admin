"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import type { SiteContent } from "@/lib/domain/contracts";
import { PageHeading, Feedback } from "@/components/shared/feedback";
import { saveContent } from "./actions";
export function ContentEditor({ initial }: { initial: SiteContent }) {
  const [draft, setDraft] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const lock = useRef(false);
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
          else setSaved(true);
        } catch {
          setError("저장 요청에 실패했습니다. 다시 시도해주세요.");
        } finally {
          lock.current = false;
          setBusy(false);
        }
      }}
    >
      <PageHeading
        title="콘텐츠 편집"
        description="저장한 공개 콘텐츠는 클라이언트 페이지를 새로 열면 반영됩니다."
        actions={
          <Link href="/content" className="text-sm text-blue-600">
            목록으로
          </Link>
        }
      />
      <Feedback message={error} />
      <Feedback
        tone="success"
        message={
          saved
            ? "저장되었습니다. 공개 상태와 웹사이트 내용을 확인해주세요."
            : ""
        }
      />
      <fieldset
        disabled={busy}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <label className="block text-sm font-semibold">
          제목
          <input
            className={input}
            required
            maxLength={200}
            value={draft.title}
            onChange={(e) => update({ ...draft, title: e.target.value })}
          />
        </label>
        <label className="block text-sm font-semibold">
          소개 / 부제목
          <textarea
            rows={3}
            className={input}
            maxLength={3000}
            value={draft.subtitle}
            onChange={(e) => update({ ...draft, subtitle: e.target.value })}
          />
        </label>
        <label className="block text-sm font-semibold">
          대표 이미지 경로
          <input
            className={input}
            value={draft.image_url}
            placeholder="https://… 또는 /images/…"
            onChange={(e) => update({ ...draft, image_url: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={draft.is_published}
            onChange={(e) =>
              update({ ...draft, is_published: e.target.checked })
            }
          />
          웹사이트에 공개
        </label>
        <p className="text-xs leading-6 text-slate-500">
          초안은 웹사이트에 노출되지 않습니다. 안내·약관 페이지의 초안은 기존
          화면을 유지합니다. 연락처와 상담 채널은 실제 운영 정보를 입력해주세요.
        </p>
      </fieldset>
      <fieldset disabled={busy} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">내용 섹션</h2>
          <button
            type="button"
            disabled={draft.sections.length >= 40}
            onClick={() =>
              update({
                ...draft,
                sections: [...draft.sections, { title: "", body: "" }],
              })
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm"
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
