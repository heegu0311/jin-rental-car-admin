"use client";

import { useState } from "react";
import Link from "next/link";
import type { Inquiry, Reservation } from "@/lib/domain/contracts";
import { INQUIRY_LABELS, RESERVATION_LABELS } from "@/lib/domain/contracts";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeading, StatusBadge } from "@/components/shared/feedback";
import { Pagination } from "@/components/shared/Pagination";
import { StatusChips } from "@/components/shared/StatusChips";
import {
  matchesRecordFilter,
  recordSubject,
  reservationCategory,
} from "@/lib/consultation";
import { formatKstDateTime, kstMonth } from "@/lib/format";
import { ReceiptMonthFilter } from "./ReceiptMonthFilter";

type Row =
  | {
      kind: "rental" | "new-car";
      record: Reservation;
      id: string;
      created_at: string;
    }
  | { kind: "inquiry"; record: Inquiry; id: string; created_at: string };

const PAGE_SIZE = 20;
const typeLabel = {
  rental: "기간 렌트",
  "new-car": "신차 장기",
  inquiry: "1:1 문의",
};

export function ConsultationList({
  reservations,
  inquiries,
}: {
  reservations: Reservation[];
  inquiries: Inquiry[];
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [receiptMonth, setReceiptMonth] = useState(() => kstMonth());
  const [page, setPage] = useState(0);
  const rows: Row[] = [
    ...reservations.map((record): Row => ({
      kind: reservationCategory(record),
      record,
      id: `reservation-${record.id}`,
      created_at: record.created_at,
    })),
    ...inquiries.map((record): Row => ({
      kind: "inquiry",
      record,
      id: `inquiry-${record.id}`,
      created_at: record.created_at,
    })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const filtered = rows.filter(
    (row) =>
      (kind === "all" || row.kind === kind) &&
      matchesRecordFilter(row.record, { query, status, month: receiptMonth }),
  );
  const changeFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="예약/문의 관리"
        description="최근 예약 상담 500건과 1:1 문의 500건을 접수일 순으로 조회합니다."
      />
      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <input
          aria-label="이름, 연락처, 제목 검색"
          placeholder="이름, 연락처, 제목/차량명 검색"
          value={query}
          onChange={(e) => changeFilter(setQuery, e.target.value)}
          className="h-11 min-w-48 flex-1 rounded-lg border border-slate-200 px-4 text-sm"
        />
        <StatusChips
          label="접수 유형으로 보기"
          group="type"
          value={kind}
          options={[
            { value: "all", label: "전체 유형" },
            { value: "rental", label: "기간 렌트" },
            { value: "new-car", label: "신차 장기" },
            { value: "inquiry", label: "1:1 문의" },
          ]}
          onChange={(value) => changeFilter(setKind, value)}
        />
        <StatusChips
          label="처리 상태로 보기"
          value={status}
          options={[
            { value: "all", label: "전체 상태" },
            { value: "pending", label: "대기중" },
            { value: "confirmed", label: "상담완료" },
            { value: "cancelled", label: "취소" },
            { value: "answered", label: "답변완료" },
          ]}
          onChange={(value) => changeFilter(setStatus, value)}
        />
        <ReceiptMonthFilter
          value={receiptMonth}
          onChange={(value) => changeFilter(setReceiptMonth, value)}
        />
      </div>
      <p className="text-sm text-slate-500">총 {filtered.length}건</p>
      <DataTable<Row>
        caption="예약 및 문의 목록"
        rows={filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)}
        columns={[
          {
            key: "kind",
            label: "접수 유형",
            render: (row) => typeLabel[row.kind],
          },
          {
            key: "status",
            label: "상태",
            render: (row) => (
              <StatusBadge tone={row.record.status}>
                {row.kind === "inquiry"
                  ? INQUIRY_LABELS[row.record.status]
                  : RESERVATION_LABELS[row.record.status]}
              </StatusBadge>
            ),
          },
          {
            key: "customer",
            label: "신청자",
            render: (row) => (
              <>
                <p className="font-semibold">{row.record.user_name}</p>
                <p className="text-xs text-slate-500">
                  {row.record.user_phone}
                </p>
              </>
            ),
          },
          {
            key: "subject",
            label: "제목/차량명",
            render: (row) => recordSubject(row.record),
          },
          {
            key: "created",
            label: "접수일",
            render: (row) => formatKstDateTime(row.created_at),
          },
          {
            key: "action",
            label: "관리",
            render: (row) => (
              <Link
                href={`${row.kind === "inquiry" ? "/inquiries" : row.kind === "new-car" ? "/new-car" : "/reservations"}?record=${row.record.id}`}
                className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-600"
              >
                상세 보기
              </Link>
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
    </div>
  );
}
