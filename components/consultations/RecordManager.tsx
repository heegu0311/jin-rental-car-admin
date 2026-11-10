"use client";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeading, StatusBadge } from "@/components/shared/feedback";
import { Pagination } from "@/components/shared/Pagination";
import { StatusChips } from "@/components/shared/StatusChips";
import {
  type Inquiry,
  type Reservation,
  INQUIRY_LABELS,
  RESERVATION_LABELS,
} from "@/lib/domain/contracts";
import {
  inquiryCategory,
  matchesRecordFilter,
  recordSubject,
  reservationCategory,
} from "@/lib/consultation";
import { formatKstDateTime, kstMonth } from "@/lib/format";
import type { RecordKind } from "@/lib/records";
import { ReceiptMonthFilter } from "./ReceiptMonthFilter";
import { RecordDetailDialog } from "./RecordDetailDialog";

type RecordRow = Reservation | Inquiry;
const PAGE_SIZE = 20;

/** 행의 분류: 예약은 rental/new-car, 문의는 제목의 [분류]. */
function categoryOf(row: RecordRow) {
  return "car_name" in row ? reservationCategory(row) : inquiryCategory(row);
}

/** 예약 상담(기간 렌트·신차) 또는 1:1 문의 목록 + 상세 처리. */
export function RecordManager({
  kind,
  initial,
  title: customTitle,
  initialCategory = "all",
  initialSelectedId,
  staffOptions = [],
  description = "최근 500건을 조회합니다. 고객 정보와 요청 내용을 확인하고 처리 상태를 관리하세요.",
}: {
  kind: RecordKind;
  initial: RecordRow[];
  title?: string;
  initialCategory?: "all" | "new-car" | "rental";
  initialSelectedId?: string;
  staffOptions?: { id: string; email: string }[];
  description?: string;
}) {
  const [rows, setRows] = useState(initial);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState<string>(initialCategory);
  const [month, setMonth] = useState(() => kstMonth());
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<RecordRow | null>(
    () => initial.find((row) => row.id === initialSelectedId) || null,
  );
  const labels: Record<string, string> =
    kind === "reservations" ? RESERVATION_LABELS : INQUIRY_LABELS;
  const title =
    customTitle ??
    (kind === "reservations" ? "예약 상담 관리" : "1:1 문의 관리");
  const inquiryCategories =
    kind === "inquiries"
      ? ["대여 문의", "사고대차", "신차 장기렌트", "기타"]
      : [];
  const filtered = rows.filter(
    (row) =>
      ((kind === "inquiries" && (category === "all" || categoryOf(row) === category)) ||
        (kind === "reservations" && (category === "all" || categoryOf(row) === category))) &&
      matchesRecordFilter(row, { query, status, month }),
  );
  /** 조건을 바꾸면 첫 페이지로 돌아간다. */
  const changeFilter =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(0);
    };
  const closeWith = (update: (prev: RecordRow[]) => RecordRow[]) => {
    setRows(update);
    setSelected(null);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <PageHeading title={title} description={description} />
      <div className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <label className="flex-1">
          <span className="sr-only">이름, 연락처, 내용 검색</span>
          <input
            value={query}
            onChange={(e) => changeFilter(setQuery)(e.target.value)}
            placeholder="이름, 연락처, 제목/차량명 검색"
            className="h-11 w-full min-w-48 rounded-lg border border-slate-200 px-4 text-sm"
          />
        </label>
        <StatusChips
          label="처리 상태로 보기"
          value={status}
          options={[
            { value: "all", label: "전체 상태" },
            ...Object.entries(labels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
          onChange={changeFilter(setStatus)}
        />
        {kind === "inquiries" ? (
          <div className="flex flex-col gap-2 text-sm font-bold text-slate-700">
            <span id="inquiry-category-label">문의 분류로 보기</span>
            <Select value={category} onValueChange={changeFilter(setCategory)}>
              <SelectTrigger
                size="lg"
                aria-labelledby="inquiry-category-label"
                className="min-w-44 font-normal"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 문의</SelectItem>
                {inquiryCategories.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <ReceiptMonthFilter value={month} onChange={changeFilter(setMonth)} />
      </div>
      <p className="text-sm text-slate-500">총 {filtered.length}건</p>
      <DataTable<RecordRow>
        caption={title}
        rows={filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)}
        columns={[
          ...(kind === "reservations"
            ? [
                {
                  key: "consultationType",
                  label: "상담 구분",
                  render: (r: RecordRow) =>
                    categoryOf(r) === "new-car" ? "신차 상담" : "예약 상담",
                },
              ]
            : []),
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
            render: recordSubject,
          },
          {
            key: "created",
            label: "접수일",
            render: (r) => formatKstDateTime(r.created_at),
          },
          {
            key: "action",
            label: "관리",
            render: (r) => (
              <button
                className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-600"
                onClick={() => setSelected(r)}
              >
                상세 보기
              </button>
            ),
          },
        ]}
      />
      <Pagination
        page={page}
        total={filtered.length}
        pageSize={PAGE_SIZE}
        onChange={setPage}
      />
      {selected && (
        <RecordDetailDialog
          key={selected.id}
          kind={kind}
          record={selected}
          title={title}
          labels={labels}
          staffOptions={staffOptions}
          onClose={() => setSelected(null)}
          onSaved={(saved) =>
            closeWith((prev) =>
              prev.map((r) => (r.id === saved.id ? saved : r)),
            )
          }
          onDeleted={(id) =>
            closeWith((prev) => prev.filter((r) => r.id !== id))
          }
        />
      )}
    </div>
  );
}
