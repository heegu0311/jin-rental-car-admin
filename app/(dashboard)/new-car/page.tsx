import { requireAdmin } from "@/lib/auth";
import { RecordManager } from "@/components/shared/RecordManager";
import type { Reservation } from "@/lib/domain/contracts";
export default async function NewCarConsultations() {
  const { db } = await requireAdmin();
  const { data, error } = await db
    .from("reservations")
    .select("*")
    .like("car_name", "[신차]%")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("신차 상담 조회 실패");
  return (
    <RecordManager
      kind="reservations"
      initial={(data || []) as Reservation[]}
      title="신차 장기렌트 상담"
      description="최근 500건의 신차 상담을 조회합니다. 고객 정보와 희망 조건을 확인하고 처리 상태를 관리하세요."
    />
  );
}
