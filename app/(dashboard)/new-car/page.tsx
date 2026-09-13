import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PageHeading, StatusBadge } from "@/components/shared/feedback";
import { DataTable } from "@/components/shared/DataTable";
import { type Reservation, RESERVATION_LABELS } from "@/lib/domain/contracts";
export default async function NewCarInquiries() {
  const { db } = await requireAdmin();
  const { data, error } = await db
    .from("reservations")
    .select("*")
    .like("car_name", "[신차]%")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("신차 상담 조회 실패");
  return (
    <div className="space-y-8">
      <PageHeading
        title="신차 장기렌트 상담"
        description="최근 500건의 신차 상담을 확인합니다. 예약 상담 관리에서 상태를 변경할 수 있습니다."
        actions={
          <Link className="text-sm text-blue-600" href="/reservations">
            상태 관리로 이동
          </Link>
        }
      />
      <DataTable<Reservation>
        caption="신차 상담 내역"
        rows={(data || []) as Reservation[]}
        columns={[
          { key: "car", label: "차량명", render: (r) => r.car_name },
          { key: "customer", label: "신청자", render: (r) => r.user_name },
          { key: "phone", label: "연락처", render: (r) => r.user_phone },
          { key: "period", label: "기간", render: (r) => r.period },
          { key: "delivery", label: "출고 시기", render: (r) => r.start_date },
          {
            key: "status",
            label: "상태",
            render: (r) => (
              <StatusBadge tone={r.status}>
                {RESERVATION_LABELS[r.status]}
              </StatusBadge>
            ),
          },
        ]}
      />
    </div>
  );
}
