import { requireAdmin } from "@/lib/auth";
import type { Inquiry, Reservation } from "@/lib/domain/contracts";
import { ConsultationDesigns } from "@/components/consultations/ConsultationDesigns";

export default async function ConsultationDesignsPage() {
  const { db } = await requireAdmin();
  const [r, i] = await Promise.all([
    db.from("reservations").select("*").order("created_at", { ascending: false }).limit(500),
    db.from("inquiries").select("*").order("created_at", { ascending: false }).limit(500),
  ]);
  if (r.error || i.error) throw new Error("예약/문의 조회 실패");
  return <ConsultationDesigns reservations={(r.data ?? []) as Reservation[]} inquiries={(i.data ?? []) as Inquiry[]} />;
}
