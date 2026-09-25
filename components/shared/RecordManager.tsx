"use client";
import { useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { DataTable } from "./DataTable";
import { ReservationDetail } from "./ReservationDetail";
import { toast } from "sonner";
import { Phone } from "lucide-react";
import { PageHeading, StatusBadge } from "./feedback";
import {
  type Reservation,
  type Inquiry,
  RESERVATION_LABELS,
  INQUIRY_LABELS,
} from "@/lib/domain/contracts";
import { updateRecord, deleteRecord } from "@/lib/records";
type RecordRow = Reservation | Inquiry;
export function RecordManager({
  kind,
  initial,
}: {
  kind: "reservations" | "inquiries";
  initial: RecordRow[];
}) {
  const [rows, setRows] = useState(initial),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState<RecordRow | null>(null),
    [answer, setAnswer] = useState(""),
    [status, setStatus] = useState("pending"),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const labels: Record<string, string> =
    kind === "reservations" ? RESERVATION_LABELS : INQUIRY_LABELS;
  const filtered = rows.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      `${r.user_name} ${r.user_phone} ${"car_name" in r ? r.car_name : r.title}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  async function save(remove = false) {
    if (!selected || lock.current) return;
    if (
      remove &&
      !window.confirm(
        "선택한 내역을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.",
      )
    )
      return;
    lock.current = true;
    setBusy(true);
    try {
      const result = remove
        ? await deleteRecord(kind, selected.id)
        : await updateRecord(kind, selected.id, status, answer);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setRows((prev) =>
        remove
          ? prev.filter((r) => r.id !== selected.id)
          : prev.map((r) =>
              r.id === selected.id
                ? ({
                    ...r,
                    status,
                    ...(kind === "inquiries" ? { answer_content: answer } : {}),
                  } as RecordRow)
                : r,
            ),
      );
      setSelected(null);
      setPage(0);
      toast.success(
        remove ? "내역을 삭제했습니다." : "처리 상태를 저장했습니다.",
      );
    } catch {
      toast.error("요청을 처리하지 못했습니다. 다시 시도해주세요.");
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  const title = kind === "reservations" ? "예약 상담 관리" : "1:1 문의 관리";
  return (
    <div className="space-y-6">
      <PageHeading
        title={title}
        description="최근 500건을 조회합니다. 고객 정보와 요청 내용을 확인하고 처리 상태를 관리하세요."
      />
      <div className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <label className="flex-1">
          <span className="sr-only">이름, 연락처, 내용 검색</span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="이름, 연락처, 제목/차량명 검색"
            className="h-11 w-full min-w-48 rounded-lg border border-slate-200 px-4 text-sm"
          />
        </label>
        <select
          aria-label="처리 상태"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border border-slate-200 px-4 text-sm"
        >
          <option value="all">전체 상태</option>
          {Object.entries(labels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-slate-500">총 {filtered.length}건</p>
      <DataTable<RecordRow>
        caption={title}
        rows={filtered.slice(page * 20, (page + 1) * 20)}
        columns={[
          {
            key: "status",
            label: "상태",
            render: (r) => (
              <StatusBadge tone={r.status}>{labels[r.status]}</StatusBadge>
            ),
          },
          {
            key: "customer",
            label: "신청자",
            render: (r) => (
              <div>
                <p className="font-semibold">{r.user_name}</p>
                <p className="mt-1 text-xs text-slate-500">{r.user_phone}</p>
              </div>
            ),
          },
          {
            key: "title",
            label: kind === "reservations" ? "희망 차량" : "문의 제목",
            render: (r) => ("car_name" in r ? r.car_name : r.title),
          },
          {
            key: "created",
            label: "접수일",
            render: (r) =>
              new Date(r.created_at).toLocaleString("ko-KR", {
                timeZone: "Asia/Seoul",
              }),
          },
          {
            key: "action",
            label: "관리",
            render: (r) => (
              <button
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-600"
                onClick={() => {
                  setSelected(r);
                  setStatus(r.status);
                  setAnswer(
                    "answer_content" in r ? r.answer_content || "" : "",
                  );
                }}
              >
                상세 보기
              </button>
            ),
          },
        ]}
      />
      <div className="flex items-center justify-end gap-4 text-sm">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          className="rounded border bg-white px-4 py-2 disabled:opacity-30"
        >
          이전
        </button>
        <span>
          {page + 1} / {Math.max(1, Math.ceil(filtered.length / 20))}
        </span>
        <button
          disabled={(page + 1) * 20 >= filtered.length}
          onClick={() => setPage((p) => p + 1)}
          className="rounded border bg-white px-4 py-2 disabled:opacity-30"
        >
          다음
        </button>
      </div>
      <Dialog.Root
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !busy) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-32px)] max-w-xl -translate-x-1/2 -translate-y-1/2 space-y-5 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold">
              {title} 상세
            </Dialog.Title>
            <Dialog.Description asChild>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">신청자</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">
                    {selected?.user_name}
                  </p>
                </div>
                {selected && <PhoneLink phone={selected.user_phone} />}
              </div>
            </Dialog.Description>
            {selected &&
              ("car_name" in selected ? (
                <ReservationDetail reservation={selected} />
              ) : (
                <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                  <h3 className="font-semibold">{selected.title}</h3>
                  <p className="whitespace-pre-wrap text-sm leading-7">
                    {selected.content}
                  </p>
                  {selected.user_email && (
                    <p className="text-sm text-slate-500">
                      {selected.user_email}
                    </p>
                  )}
                </div>
              ))}
            <label className="block space-y-2 text-sm font-semibold">
              처리 상태
              <select
                disabled={busy}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-2 block h-11 w-full rounded-lg border border-slate-200 px-3"
              >
                {Object.entries(labels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            {kind === "inquiries" && (
              <label className="block text-sm font-semibold">
                답변 / 처리 기록
                <textarea
                  disabled={busy}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  maxLength={5000}
                  rows={5}
                  className="mt-2 w-full rounded-lg border border-slate-200 p-3"
                />
                <span className="text-xs font-normal text-slate-500">
                  저장되는 내부 답변 기록입니다. 고객에게 자동 발송되지는
                  않습니다.
                </span>
              </label>
            )}
            <div className="flex justify-between gap-3">
              <button
                disabled={busy}
                onClick={() => save(true)}
                className="text-sm text-red-600 disabled:opacity-50"
              >
                내역 삭제
              </button>
              <div className="flex gap-3">
                <Dialog.Close
                  disabled={busy}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  닫기
                </Dialog.Close>
                <button
                  disabled={busy}
                  onClick={() => save()}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "처리 중…" : "저장"}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function PhoneLink({ phone }: { phone: string }) {
  const digits = phone.replace(/\D/g, "");
  const display =
    digits.length === 11
      ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
      : digits.length === 10
        ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
        : phone;
  if (!digits) return <span className="text-sm text-slate-500">{phone}</span>;
  return (
    <a
      href={`tel:${digits}`}
      aria-label={`${display}로 전화 걸기`}
      className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-50 px-4 text-base font-bold tabular-nums text-blue-700 hover:bg-blue-100"
    >
      <Phone aria-hidden className="size-4" />
      {display}
    </a>
  );
}
