import { requireAdmin } from "@/lib/auth";
import { ConsultationList } from "@/components/shared/ConsultationList";
import type { Inquiry, Reservation } from "@/lib/domain/contracts";

export default async function ConsultationsPage() {
  const { db } = await requireAdmin();
  const [reservationResult, inquiryResult] = await Promise.all([
    db
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    db
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  if (reservationResult.error || inquiryResult.error) {
    throw new Error("예약/문의 조회 실패");
  }
  return (
    <ConsultationList
      reservations={(reservationResult.data || []) as Reservation[]}
      inquiries={(inquiryResult.data || []) as Inquiry[]}
    />
  );
}
