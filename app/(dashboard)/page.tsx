import Link from "next/link";
import { reservationCategory } from "@/lib/consultation";
import { requireAdmin } from "@/lib/auth";
import { StatusBadge, EmptyState } from "@/components/shared/feedback";
import { Panel } from "@/components/shared/Panel";
import {
  RESERVATION_LABELS,
  INQUIRY_LABELS,
  type Reservation,
  type Inquiry,
} from "@/lib/domain/contracts";

function reservationHref(record: Reservation) {
  const path =
    reservationCategory(record) === "new-car" ? "/new-car" : "/reservations";
  return `${path}?record=${encodeURIComponent(record.id)}`;
}

function displayStartDate(value: string) {
  return value.replace(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})(?::\d{2})?$/,
    "$1. $2. $3. $4",
  );
}
export default async function DashboardPage() {
  const { db } = await requireAdmin();
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
  });
  const calendar = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getTime() - (6 - i) * 86400000);
    const key = dateFormatter.format(date);
    const start = new Date(`${key}T00:00:00+09:00`);
    return {
      key,
      label: new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        weekday: "short",
      }).format(date),
      start: start.toISOString(),
      end: new Date(start.getTime() + 86400000).toISOString(),
    };
  });
  const since = calendar[0].start;
  const result = await Promise.all([
    db.from("vehicles").select("id", { count: "exact", head: true }),
    db
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    db
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8),
    db
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(4),
    ...calendar.map((day) =>
      db
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .gte("created_at", day.start)
        .lt("created_at", day.end),
    ),
  ]);
  if (result.some((r) => r.error)) throw new Error("대시보드 조회 실패");
  const bookings = result[4].data as Reservation[],
    inquiries = result[5].data as Inquiry[];
  const stats = [
    ["전체 차량 모델", result[0].count, "대", "/vehicles"],
    ["처리 대기 상담", result[1].count, "건", "/reservations"],
    ["최근 7일 상담 접수", result[2].count, "건", "/reservations"],
    ["미답변 문의", result[3].count, "건", "/inquiries"],
  ];
  const days = calendar.map((day, i) => ({
    ...day,
    count: result[6 + i].count || 0,
  }));
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="space-y-6">
      <h1 className="sr-only">대시보드 개요</h1>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, unit, href]) => (
          <Link
            key={String(label)}
            href={String(href)}
            className="rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-300"
          >
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {value ?? 0}
              <span className="ml-2 text-lg">{unit}</span>
            </p>
          </Link>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.43fr_1fr]">
        <Panel title="상담 접수 추이 (최근 7일)">
          <div
            className="flex h-[196px] items-end justify-between gap-4 pt-4"
            role="img"
            aria-label={days.map((d) => `${d.key}: ${d.count}건`).join(", ")}
          >
            {days.map((d) => (
              <div
                key={d.key}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-xs text-slate-500">{d.count}건</span>
                <div
                  className="w-5 max-w-full rounded-t bg-blue-900"
                  style={{ height: `${(d.count / max) * 140}px`, minHeight: 2 }}
                />
                <span className="text-xs font-semibold">{d.label}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="최근 고객 문의"
          action={
            <Link href="/inquiries" className="text-xs text-blue-600">
              전체보기
            </Link>
          }
        >
          {inquiries.length ? (
            <div className="divide-y divide-slate-100">
              {inquiries.map((i) => (
                <Link
                  key={i.id}
                  href={`/inquiries?record=${encodeURIComponent(i.id)}`}
                  className="block space-y-2 rounded py-4 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  <p className="text-sm font-semibold">{i.title}</p>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">
                      {i.user_name}
                    </span>
                    <StatusBadge tone={i.status}>
                      {INQUIRY_LABELS[i.status]}
                    </StatusBadge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center font-semibold text-slate-700 md:py-16">
              등록된 내용이 없습니다.
            </div>
          )}
        </Panel>
      </div>
      <Panel
        title="최근 상담 접수"
        action={
          <Link href="/reservations" className="text-xs text-blue-600">
            전체보기
          </Link>
        }
      >
        {!bookings.length ? (
          <EmptyState />
        ) : (
          <>
            <ul className="divide-y divide-slate-100 md:hidden">
              {bookings.map((b) => (
                <li
                  key={b.id}
                  className="relative space-y-2 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 break-words text-sm font-semibold leading-6 text-slate-900">
                      <Link
                        href={reservationHref(b)}
                        className="after:absolute after:inset-0 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"
                      >
                        {b.car_name}
                      </Link>
                    </p>
                    <StatusBadge tone={b.status}>
                      {RESERVATION_LABELS[b.status]}
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-slate-600">
                    {b.user_name} · {b.period}
                  </p>
                  <p className="text-sm text-slate-500">
                    희망 시작일 {displayStartDate(b.start_date)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">최근 상담 접수</caption>
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    {[
                      "차량명",
                      "고객명",
                      "희망 시작일",
                      "기간",
                      "상태",
                      "관리",
                    ].map((s) => (
                      <th key={s} className="p-3" scope="col">
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-slate-100">
                      <td className="p-3">
                        <Link
                          href={reservationHref(b)}
                          className="rounded font-semibold hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
                        >
                          {b.car_name}
                        </Link>
                      </td>
                      <td className="p-3">{b.user_name}</td>
                      <td className="p-3">{displayStartDate(b.start_date)}</td>
                      <td className="p-3">{b.period}</td>
                      <td className="p-3">
                        <StatusBadge tone={b.status}>
                          {RESERVATION_LABELS[b.status]}
                        </StatusBadge>
                      </td>
                      <td className="p-3">
                        <Link
                          href={reservationHref(b)}
                          className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-600 focus-visible:outline-2 focus-visible:outline-blue-600"
                        >
                          상세 보기
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
