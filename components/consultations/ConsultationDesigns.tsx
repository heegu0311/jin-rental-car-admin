"use client";

import { useMemo, useState } from "react";
import { PageHeading, StatusBadge } from "@/components/shared/feedback";
import { Pagination } from "@/components/shared/Pagination";
import type { Inquiry, Reservation } from "@/lib/domain/contracts";
import { INQUIRY_LABELS, RESERVATION_LABELS } from "@/lib/domain/contracts";
import { matchesRecordFilter, recordSubject, reservationCategory } from "@/lib/consultation";
import { formatKstDateTime, kstMonth } from "@/lib/format";
import { ReceiptMonthFilter } from "./ReceiptMonthFilter";

type Row = { kind: "rental" | "new-car" | "inquiry"; record: Reservation | Inquiry };
const types = [{ value: "all", label: "전체" }, { value: "rental", label: "기간 렌트" }, { value: "new-car", label: "신차 장기" }, { value: "inquiry", label: "1:1 문의" }];
const statuses = [{ value: "all", label: "전체 상태" }, { value: "pending", label: "대기중" }, { value: "confirmed", label: "상담완료" }, { value: "cancelled", label: "취소" }, { value: "answered", label: "답변완료" }];

export function ConsultationDesigns({ reservations, inquiries }: { reservations: Reservation[]; inquiries: Inquiry[] }) {
  const [variant, setVariant] = useState(0);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [month, setMonth] = useState(() => kstMonth());
  const [page, setPage] = useState(0);
  const rows: Row[] = useMemo(() => [...reservations.map(record => ({ kind: reservationCategory(record), record } as Row)), ...inquiries.map(record => ({ kind: "inquiry", record } as Row))].sort((a,b) => b.record.created_at.localeCompare(a.record.created_at)), [reservations, inquiries]);
  const filtered = rows.filter(x => (kind === "all" || x.kind === kind) && matchesRecordFilter(x.record, { query, status, month }));
  const input = <input aria-label="이름, 연락처, 제목 검색" placeholder="이름, 연락처, 제목/차량명 검색" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm" />;
  const typeTabs = <div className="flex flex-wrap gap-2">{types.map(x => <button key={x.value} onClick={() => { setKind(x.value); setPage(0); }} className={`rounded-full border px-4 py-2 text-sm font-semibold ${kind === x.value ? "border-slate-700 bg-slate-800 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`}>{x.label}</button>)}</div>;
  const statusTabs = <div className="flex flex-wrap gap-2">{statuses.map(x => <button key={x.value} onClick={() => { setStatus(x.value); setPage(0); }} className={`rounded-lg border px-3 py-2 text-sm ${status === x.value ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{x.label}</button>)}</div>;
  const monthFilter = <ReceiptMonthFilter value={month} onChange={v => { setMonth(v); setPage(0); }} />;
  return <div className="space-y-5">
    <PageHeading title="예약 문의 관리 · 시안 비교" description="실제 접수 데이터로 세 가지 필터 배치를 비교합니다." />
    <div className="flex flex-wrap gap-2">{["간결형", "업무형", "분할형"].map((x,i)=><button key={x} onClick={()=>setVariant(i)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${variant===i?"bg-slate-800 text-white":"border border-slate-200 bg-white text-slate-600"}`}>시안 {i+1} · {x}</button>)}</div>
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-slate-800">{["시안 1 · 간결형", "시안 2 · 업무형", "시안 3 · 분할형"][variant]}</h2><p className="mt-1 text-sm text-slate-500">{["검색과 기간을 한 줄에, 유형과 상태는 빠른 탭으로.", "처리 상태를 먼저 고르고 바로 목록을 확인.", "필터 영역을 모아두고 결과 목록은 넓게 유지."][variant]}</p></div><span className="text-sm text-slate-500">{filtered.length}건</span></div>
      {variant===0 && <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"><div className="grid gap-3 md:grid-cols-[1fr_auto]">{input}<div className="min-w-52">{monthFilter}</div></div><div><p className="mb-2 text-xs font-bold text-slate-500">접수 유형</p>{typeTabs}</div><div><p className="mb-2 text-xs font-bold text-slate-500">처리 상태</p>{statusTabs}</div></div>}
      {variant===1 && <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center gap-3"><span className="text-sm font-bold">처리 상태</span>{statusTabs}<div className="ml-auto">{monthFilter}</div></div><div className="grid gap-3 md:grid-cols-[1fr_auto]">{input}{typeTabs}</div></div>}
      {variant===2 && <div className="grid gap-4 md:grid-cols-[260px_1fr]"><aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"><div>{input}</div><div><p className="mb-2 text-xs font-bold text-slate-500">접수 유형</p>{typeTabs}</div><div><p className="mb-2 text-xs font-bold text-slate-500">처리 상태</p>{statusTabs}</div>{monthFilter}</aside><div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">필터를 왼쪽에 모으고 목록을 오른쪽에 배치하는 방식입니다. 아래 결과 목록에서 바로 비교할 수 있습니다.</div></div>}
    </section>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="divide-y divide-slate-100">{filtered.slice(page*12,(page+1)*12).map(x=><div key={x.record.id} className="grid gap-2 px-4 py-3 md:grid-cols-[110px_100px_1fr_1fr_150px]"><span className="text-sm text-slate-500">{x.kind==="inquiry"?"1:1 문의":x.kind==="new-car"?"신차 장기":"기간 렌트"}</span><StatusBadge tone={x.record.status}>{("car_name" in x.record ? RESERVATION_LABELS : INQUIRY_LABELS)[x.record.status as keyof typeof RESERVATION_LABELS & keyof typeof INQUIRY_LABELS]}</StatusBadge><span className="font-semibold">{x.record.user_name}</span><span className="truncate text-sm text-slate-600">{recordSubject(x.record)}</span><span className="text-sm text-slate-500">{formatKstDateTime(x.record.created_at)}</span></div>)}{filtered.length===0&&<p className="p-8 text-center text-sm text-slate-500">조건에 맞는 접수가 없습니다.</p>}</div></section>
    <Pagination page={page} total={filtered.length} pageSize={12} onChange={setPage} />
  </div>;
}
