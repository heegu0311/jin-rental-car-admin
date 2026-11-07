"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { savePopupOrder } from "@/app/(dashboard)/events/actions";
import { movePopup } from "@/lib/domain/popup-order";
import { useSubmitLock } from "@/lib/hooks/use-submit-lock";
import { notifySaved } from "@/lib/public-site";

type PopupItem = {
  id: string;
  title: string;
  popup_order?: number;
  created_at: string;
};

/** 필터와 무관한 전체 팝업 목록. 서버에서도 전체 ID 일치를 확인해 누락 저장을 막는다. */
export function PopupOrderManager({ events }: { events: PopupItem[] }) {
  const [rows, setRows] = useState(() =>
    [...events].sort(
      (a, b) =>
        (a.popup_order ?? 0) - (b.popup_order ?? 0) ||
        b.created_at.localeCompare(a.created_at) ||
        b.id.localeCompare(a.id),
    ),
  );
  const [savedIds, setSavedIds] = useState(() => rows.map((row) => row.id));
  const [dragging, setDragging] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const { busy, run } = useSubmitLock();
  const dirty = rows.some((row, index) => row.id !== savedIds[index]);

  function move(from: string, to: string) {
    if (busy) return;
    const next = movePopup(rows, from, to);
    setRows(next);
    const index = next.findIndex((row) => row.id === from);
    if (index >= 0)
      setAnnouncement(
        `${next[index].title}: ${index + 1}번째로 이동했습니다. 순서 저장을 눌러 반영하세요.`,
      );
  }

  async function save() {
    await run(async () => {
      try {
        const ids = rows.map((row) => row.id);
        const result = await savePopupOrder(ids);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        if (!result.success) return;
        setSavedIds(ids);
        notifySaved("팝업 순서를 저장했습니다.", result.site);
      } catch {
        toast.error(
          "순서를 저장하지 못했습니다. 변경한 순서는 유지되니 다시 시도해주세요.",
        );
      }
    });
  }

  return (
    <section
      aria-labelledby="popup-order-heading"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="popup-order-heading" className="font-bold text-slate-900">
            홈 팝업 순서
          </h2>
          <p
            id="popup-order-instructions"
            className="mt-1 text-sm text-slate-500"
          >
            목록을 드래그한 뒤 순서를 저장하세요. 위쪽 이벤트부터 표시됩니다.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            검색·필터와 관계없이 팝업으로 설정한 전체 이벤트입니다. 비공개·기간
            외 이벤트는 고객 웹에서 표시하지 않습니다.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={!dirty || busy}
            onClick={() =>
              setRows(
                savedIds.flatMap((id) => rows.filter((row) => row.id === id)),
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
          >
            되돌리기
          </button>
          <button
            type="button"
            disabled={!dirty || busy}
            onClick={save}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {busy ? "저장 중..." : "순서 저장"}
          </button>
        </div>
      </div>
      {!rows.length ? (
        <p className="text-sm text-slate-500">
          이벤트 등록·수정에서 ‘홈 팝업으로 표시’를 선택하면 여기에 표시됩니다.
        </p>
      ) : (
        <ol className="space-y-2" aria-describedby="popup-order-instructions">
          {rows.map((row, index) => (
            <li
              key={row.id}
              data-popup-id={row.id}
              draggable={!busy}
              onDragStart={(event) => {
                if (busy) {
                  event.preventDefault();
                  return;
                }
                event.dataTransfer.setData("text/plain", row.id);
                event.dataTransfer.effectAllowed = "move";
                setDragging(row.id);
              }}
              onDragOver={(event) => {
                if (!busy) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                move(event.dataTransfer.getData("text/plain"), row.id);
                setDragging(null);
              }}
              onDragEnd={() => setDragging(null)}
              className={`flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 ${dragging === row.id ? "opacity-50" : ""} ${busy ? "" : "cursor-grab active:cursor-grabbing"}`}
            >
              <GripVertical
                className="size-5 shrink-0 text-slate-400"
                aria-hidden
              />
              <span className="w-6 shrink-0 text-center text-sm font-bold text-blue-600">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-700">
                {row.title}
              </span>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  disabled={busy || index === 0}
                  aria-label={`${row.title} 위로 이동`}
                  onClick={() => move(row.id, rows[index - 1].id)}
                  className="grid size-9 place-items-center rounded-md border bg-white text-slate-600 hover:text-blue-600 disabled:opacity-30"
                >
                  <ArrowUp className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  disabled={busy || index === rows.length - 1}
                  aria-label={`${row.title} 아래로 이동`}
                  onClick={() => move(row.id, rows[index + 1].id)}
                  className="grid size-9 place-items-center rounded-md border bg-white text-slate-600 hover:text-blue-600 disabled:opacity-30"
                >
                  <ArrowDown className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {dirty && (
        <p className="text-xs font-medium text-amber-700">
          아직 저장하지 않은 순서 변경이 있습니다.
        </p>
      )}
    </section>
  );
}
