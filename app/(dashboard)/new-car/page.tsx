import { requireAdmin } from "@/lib/auth";
import { RecordManager } from "@/components/shared/RecordManager";
import type { Reservation } from "@/lib/domain/contracts";
export default async function NewCarConsultations({
  searchParams,
}: {
  searchParams: Promise<{ record?: string }>;
}) {
  const { record } = await searchParams;
  const { db } = await requireAdmin();
  const { data, error } = await db
    .from("reservations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("신차 상담 조회 실패");
  return (
    <RecordManager
      kind="reservations"
      key="new-car"
      initialCategory="new-car"
      initialSelectedId={record}
      initial={(data || []) as Reservation[]}
      title="신차 장기렌트 상담"
      description="최근 500건의 예약 상담에서 신차 상담을 먼저 보여줍니다. 필터를 변경해 다른 상담도 확인할 수 있습니다."
    />
  );
}
