"use client";

import { useState } from "react";
import Link from "next/link";
import type { Inquiry, Reservation } from "@/lib/domain/contracts";
import { INQUIRY_LABELS, RESERVATION_LABELS } from "@/lib/domain/contracts";
import { DataTable } from "./DataTable";
import { PageHeading, StatusBadge } from "./feedback";
import { StatusChips } from "./StatusChips";

type Row =
  | {
      kind: "rental" | "new-car";
      record: Reservation;
      id: string;
      created_at: string;
    }
  | { kind: "inquiry"; record: Inquiry; id: string; created_at: string };

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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const rows: Row[] = [
    ...reservations.map((record): Row => ({
      kind: record.car_name.startsWith("[신차]") ? "new-car" : "rental",
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
  const filtered = rows.filter((row) => {
    const date = new Date(row.created_at).toLocaleDateString("sv-SE", {
      timeZone: "Asia/Seoul",
    });
    const subject =
      row.kind === "inquiry" ? row.record.title : row.record.car_name;
    const search =
      `${row.record.user_name} ${row.record.user_phone} ${subject}`.toLowerCase();
    return (
      (kind === "all" || row.kind === kind) &&
      (status === "all" || row.record.status === status) &&
      (!fromDate || date >= fromDate) &&
      (!toDate || date <= toDate) &&
      search.includes(query.toLowerCase())
    );
  });
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
        <select
          aria-label="접수 유형"
          value={kind}
          onChange={(e) => changeFilter(setKind, e.target.value)}
          className="h-11 rounded-lg border border-slate-200 px-3 text-sm"
        >
          <option value="all">전체 유형</option>
          <option value="rental">기간 렌트</option>
          <option value="new-car">신차 장기</option>
          <option value="inquiry">1:1 문의</option>
        </select>
        <StatusChips
          label="처리 상태 필터"
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
        <label className="flex items-center gap-2 text-sm text-slate-600">
          접수 시작{" "}
          <input
            aria-label="접수 시작일"
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => changeFilter(setFromDate, e.target.value)}
            className="h-11 rounded-lg border border-slate-200 px-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          접수 종료{" "}
          <input
            aria-label="접수 종료일"
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => changeFilter(setToDate, e.target.value)}
            className="h-11 rounded-lg border border-slate-200 px-2"
          />
        </label>
      </div>
      <p className="text-sm text-slate-500">총 {filtered.length}건</p>
      <DataTable<Row>
        caption="예약 및 문의 목록"
        rows={filtered.slice(page * 20, (page + 1) * 20)}
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
            render: (row) =>
              row.kind === "inquiry" ? row.record.title : row.record.car_name,
          },
          {
            key: "created",
            label: "접수일",
            render: (row) =>
              new Date(row.created_at).toLocaleString("ko-KR", {
                timeZone: "Asia/Seoul",
              }),
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
      <div className="flex items-center justify-end gap-4 text-sm">
        <button
          disabled={page === 0}
          onClick={() => setPage((current) => current - 1)}
          className="rounded border bg-white px-4 py-2 disabled:opacity-30"
        >
          이전
        </button>
        <span>
          {page + 1} / {Math.max(1, Math.ceil(filtered.length / 20))}
        </span>
        <button
          disabled={(page + 1) * 20 >= filtered.length}
          onClick={() => setPage((current) => current + 1)}
          className="rounded border bg-white px-4 py-2 disabled:opacity-30"
        >
          다음
        </button>
      </div>
    </div>
  );
}
