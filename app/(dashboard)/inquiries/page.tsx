import { requireAdmin } from "@/lib/auth";
import { RecordManager } from "@/components/shared/RecordManager";
import type { Inquiry } from "@/lib/domain/contracts";
export default async function Page() {
  const { db } = await requireAdmin();
  const { data, error } = await db
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("조회 실패");
  return <RecordManager kind="inquiries" initial={(data || []) as Inquiry[]} />;
}
