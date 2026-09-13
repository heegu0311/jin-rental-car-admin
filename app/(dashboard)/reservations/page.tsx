import { requireAdmin } from "@/lib/auth";
import { RecordManager } from "@/components/shared/RecordManager";
import type { Reservation } from "@/lib/domain/contracts";
export default async function Page() {
  const { db } = await requireAdmin();
  const { data, error } = await db
    .from("reservations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("조회 실패");
  return (
    <RecordManager
      kind="reservations"
      initial={(data || []) as Reservation[]}
    />
  );
}
