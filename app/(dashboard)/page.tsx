import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import {
  PageHeading,
  StatusBadge,
  EmptyState,
} from "@/components/shared/feedback";
import { Panel } from "@/components/shared/Panel";
import {
  RESERVATION_LABELS,
  INQUIRY_LABELS,
  type Reservation,
  type Inquiry,
} from "@/lib/domain/contracts";
export default async function DashboardPage() {
  const { db } = await requireAdmin();
  const since = new Date(new Date().getTime() - 7 * 86400000).toISOString();
  const result = await Promise.all([
    db.from("vehicles").select("id", { count: "exact", head: true }),
    db
      .from("vehicle_units")
      .select("id", { count: "exact", head: true })
      .eq("status", "rented"),
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
  ]);
  if (result.some((r) => r.error)) throw new Error("대시보드 조회 실패");
  const bookings = result[4].data as unknown as Reservation[],
    inquiries = result[5].data as unknown as Inquiry[];
  const stats = [
    ["전체 차량 모델", result[0].count, "대", "/vehicles"],
    ["대여 중인 실차", result[1].count, "대", "/vehicles"],
    ["최근 7일 상담 접수", result[2].count, "건", "/reservations"],
    ["미답변 문의", result[3].count, "건", "/inquiries"],
  ];
  return (
    <div className="space-y-8">
      <PageHeading
        title="대시보드 개요"
        description="실제 등록된 차량과 고객 상담 현황입니다."
      />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, unit, href]) => (
          <Link
            key={String(label)}
            href={String(href)}
            className="rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-300"
          >
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-5 text-3xl font-extrabold text-slate-900">
              {value ?? 0}
              <span className="ml-2 text-lg">{unit}</span>
            </p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">최근 상담 접수</caption>
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    {["차량명", "고객명", "희망 시작일", "기간", "상태"].map(
                      (s) => (
                        <th key={s} className="p-3" scope="col">
                          {s}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-slate-100">
                      <td className="p-3">{b.car_name}</td>
                      <td className="p-3">{b.user_name}</td>
                      <td className="p-3">{b.start_date}</td>
                      <td className="p-3">{b.period}</td>
                      <td className="p-3">
                        <StatusBadge tone={b.status}>
                          {RESERVATION_LABELS[b.status]}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                  href="/inquiries"
                  className="block space-y-2 py-4"
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
            <EmptyState />
          )}
        </Panel>
      </div>
    </div>
  );
}
