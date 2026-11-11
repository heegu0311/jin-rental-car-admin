import { requireAdmin } from "@/lib/auth";
import { RecordManager } from "@/components/consultations/RecordManager";
import type { Reservation } from "@/lib/domain/contracts";
import type { ReservationConsultationResult } from "@/lib/domain/consultation-result";
import {
  INSURANCE_CONTENT_SLUG,
  parseInsuranceConfig,
  type InsuranceConfig,
  type Vehicle,
} from "@/lib/domain/contracts";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ record?: string }>;
}) {
  const { record } = await searchParams;
  const { db } = await requireAdmin();
  const [{ data, error }, { data: vehicles }, { data: insuranceRow }] =
    await Promise.all([
      db
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      db.from("vehicles").select("*").order("name"),
      db
        .from("site_content")
        .select("sections, is_published")
        .eq("slug", INSURANCE_CONTENT_SLUG)
        .maybeSingle(),
    ]);
  if (error) throw new Error("조회 실패");
  const reservationIds = (data ?? []).map((reservation) => reservation.id);
  let results: ReservationConsultationResult[] = [];
  if (reservationIds.length) {
    const resultQuery = await db
      .from("reservation_consultation_results")
      .select("*")
      .in("reservation_id", reservationIds);
    if (resultQuery.error) throw new Error("상담 결과 조회 실패");
    results = (resultQuery.data ?? []) as ReservationConsultationResult[];
  }
  let insurance: InsuranceConfig | null = null;
  try {
    insurance =
      insuranceRow?.is_published && insuranceRow.sections?.[0]?.body
        ? parseInsuranceConfig(JSON.parse(insuranceRow.sections[0].body))
        : null;
  } catch {
    insurance = null;
  }
  return (
    <RecordManager
      kind="reservations"
      key="reservations"
      initialCategory="rental"
      initialSelectedId={record}
      initial={(data || []) as Reservation[]}
      vehicles={(vehicles || []) as Vehicle[]}
      insurance={insurance}
      consultationResults={Object.fromEntries(
        (results ?? []).map((result) => [
          result.reservation_id,
          result as ReservationConsultationResult,
        ]),
      )}
    />
  );
}
